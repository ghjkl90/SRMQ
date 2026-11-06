// scripts/create-admin.js — 관리자 계정 만들기 / 기존 회원을 관리자로 지정
//
//   npm run create-admin -- --email admin@srmq.or.kr --name "사무국 관리자"
//   npm run create-admin -- --email admin@srmq.or.kr --name "사무국 관리자" --password 'Srmq!2026'
//
// --password 를 생략하면 임시 비밀번호를 만들어 화면에 한 번만 보여 줍니다. 로그인 후 마이페이지에서 바꾸세요.
import { randomBytes } from 'node:crypto';
import { loadConfig } from '../src/config.js';
import { createDb } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';
import { hashPassword, newCustomerKey } from '../src/lib/security.js';
import { passwordSchema } from '../src/lib/validation.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
    return acc;
  }, []),
);

const email = String(args.email || '').trim().toLowerCase();
const name = String(args.name || '관리자').trim();
if (!email || !email.includes('@')) {
  console.error('사용법: npm run create-admin -- --email admin@srmq.or.kr --name "사무국 관리자" [--password ...]');
  process.exit(1);
}

const generated = !args.password;
const password = args.password || `Srmq!${randomBytes(4).toString('hex')}`;
const check = passwordSchema.safeParse(password);
if (!check.success) {
  console.error(`비밀번호 규칙 오류: ${check.error.issues[0].message}`);
  process.exit(1);
}

const config = loadConfig();
const db = createDb(config.databaseUrl);
try {
  await runMigrations(db, { log: () => {} });
  const passwordHash = await hashPassword(password);
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) {
    await db.query(
      `UPDATE users SET role = 'ADMIN', status = 'ACTIVE', password_hash = $2, password_set = true, token_version = token_version + 1,
              updated_at = now() WHERE id = $1`,
      [existing.rows[0].id, passwordHash],
    );
    console.log(`기존 계정 ${email} 을(를) 관리자로 지정하고 비밀번호를 재설정했습니다.`);
  } else {
    await db.query(
      `INSERT INTO users (email, password_hash, role, source, member_type, name, phone, affiliation,
                          terms_agreed_at, privacy_agreed_at, customer_key)
       VALUES ($1, $2, 'ADMIN', 'ADMIN', 'INDIVIDUAL', $3, '', '사회적책임경영품질원', now(), now(), $4)`,
      [email, passwordHash, name, newCustomerKey()],
    );
    console.log(`관리자 계정을 만들었습니다: ${email}`);
  }
  if (generated) console.log(`임시 비밀번호: ${password}  ← 로그인 후 마이페이지에서 꼭 변경하세요.`);
} finally {
  await db.end();
}
