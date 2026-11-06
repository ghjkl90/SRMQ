// scripts/migrate.js — DB 테이블 생성/변경 (서버 시작 시에도 자동 실행됩니다)
import { loadConfig } from '../src/config.js';
import { createDb } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';

const config = loadConfig();
const db = createDb(config.databaseUrl);
try {
  await runMigrations(db);
  console.log('[migrate] 완료');
} finally {
  await db.end();
}
