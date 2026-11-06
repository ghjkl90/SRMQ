// scripts/import-members.js — 회원명부(CSV)를 회비 납부 완료 회원으로 등록
//
//   (server 폴더에서)
//   npm run import-members -- --file C:/경로/members-import.csv --dry-run   ← 먼저 확인만
//   npm run import-members -- --file C:/경로/members-import.csv             ← 실제 등록
//
// CSV 머리글: 성명, 이메일, 휴대폰, 소속, 등급, 자격시작, 만료일, 메모   (엑셀 "CSV UTF-8" 로 저장)
//   - 등급 칸이 비면 --plan (기본 정회원), 자격시작 · 만료일 칸이 비면 --started · --expires 값을 씁니다.
//   - 이메일이 없는 행은 건너뜁니다. 이메일을 채운 뒤 다시 실행하면 그 회원만 추가됩니다.
//   - 등록된 회원은 '비밀번호 찾기'로 처음 비밀번호를 만들어 로그인합니다.
import { readFile } from 'node:fs/promises';
import { loadConfig } from '../src/config.js';
import { createDb } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';
import { formatKstDate } from '../src/lib/dates.js';
import { importMembers, parseCsv, rowsToRecords } from '../src/services/memberImport.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
    return acc;
  }, []),
);

const usage = '사용법: npm run import-members -- --file <CSV 경로> [--dry-run] [--plan REGULAR] [--started 2026-10-31] [--expires 2027-10-31]';
if (!args.file || args.file === 'true') {
  console.error(usage);
  process.exit(1);
}
for (const key of ['started', 'expires']) {
  if (args[key] && !/^\d{4}-\d{2}-\d{2}$/.test(args[key])) {
    console.error(`--${key} 는 YYYY-MM-DD 형식으로 넣어 주세요.`);
    process.exit(1);
  }
}

let text;
try {
  text = await readFile(args.file, 'utf8');
} catch {
  console.error(`파일을 열 수 없습니다: ${args.file}`);
  process.exit(1);
}

let records;
try {
  records = rowsToRecords(parseCsv(text));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const dryRun = args['dry-run'] === 'true';
const config = loadConfig();
const db = createDb(config.databaseUrl);
const day = (d) => (d ? formatKstDate(d) : '기한 없음');

try {
  await runMigrations(db, { log: () => {} });
  const r = await importMembers(db, records, {
    defaultPlan: args.plan || 'REGULAR',
    startedAt: args.started || null,
    expiresAt: args.expires || null,
    dryRun,
  });

  console.log(dryRun ? '\n[확인만 했습니다 — 저장하지 않았습니다. --dry-run 을 빼고 실행하면 등록됩니다]\n' : '');
  console.log(`명부 ${records.length}행 → 새로 등록 ${r.created.length}명 · 자격 반영 ${r.updated.length}명 · 그대로 ${r.unchanged.length}명 · 건너뜀 ${r.skipped.length}행`);
  for (const m of r.created) console.log(`  + ${m.name} <${m.email}> ${m.plan} ~ ${day(m.expiresAt)}`);
  for (const m of r.updated) console.log(`  ↻ ${m.name} <${m.email}> ${m.plan} ~ ${day(m.expiresAt)} (기존 계정)`);
  for (const m of r.unchanged) console.log(`  = ${m.name} <${m.email}> ${m.reason}`);
  if (r.skipped.length) {
    console.log('\n건너뛴 행:');
    for (const m of r.skipped) console.log(`  - ${m.line}행 ${m.name || ''}: ${m.reason}`);
  }
  if (!dryRun && r.created.length) {
    console.log('\n새로 등록된 회원은 로그인 화면 → 비밀번호 찾기에서 자기 이메일로 비밀번호를 만든 뒤 로그인합니다.');
  }
} finally {
  await db.end();
}
