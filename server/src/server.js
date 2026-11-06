// src/server.js
import { mkdir } from 'node:fs/promises';
import { loadConfig } from './config.js';
import { createDb } from './db.js';
import { runMigrations } from './migrate.js';
import { createApp } from './app.js';
import { createTossClient } from './services/toss.js';
import { createMailer } from './services/mailer.js';
import { createStorage } from './services/storage.js';
import { startScheduler } from './scheduler.js';

const config = loadConfig();
const db = createDb(config.databaseUrl);

if (config.migrateOnStart) await runMigrations(db);
await mkdir(config.uploads.dir, { recursive: true });

const toss = createTossClient(config.toss);
const mailer = createMailer(config.mail);
const storage = createStorage(config.uploads);
const app = createApp({ config, db, toss, mailer, storage });

// Express 5 는 포트를 못 열었을 때(이미 사용 중 등)도 이 콜백을 오류와 함께 부릅니다 → 오류면 바로 종료
const server = app.listen(config.port, config.host, (err) => {
  if (err) {
    const reason = err.code === 'EADDRINUSE' ? '이미 다른 프로그램(또는 이전에 띄운 API)이 이 포트를 쓰고 있습니다' : err.message;
    console.error(`[srmq-api] ${config.host}:${config.port} 에서 시작하지 못했습니다 — ${reason}`);
    process.exit(1);
  }
  console.log(`[srmq-api] http://${config.host}:${config.port} (${config.env})`);
  if (!toss.isConfigured) console.log('[srmq-api] TOSS_SECRET_KEY 미설정 → 카드·간편결제 비활성 (무통장입금만 가능)');
  if (!config.mail.host) console.log('[srmq-api] SMTP 미설정 → 메일은 로그로만 출력됩니다');
  if (config.testPayment.enabled) console.warn('[srmq-api] ⚠ 0원 테스트 결제가 켜져 있습니다 (TEST_PAYMENT_ENABLED). 실제 오픈 전에 꼭 끄세요.');
});

const stopScheduler = config.schedulerEnabled ? startScheduler({ db, toss, storage }) : () => {};

const shutdown = (signal) => {
  console.log(`[srmq-api] ${signal} 수신, 종료합니다`);
  stopScheduler();
  server.close(() => db.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
