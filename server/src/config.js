// src/config.js
// 모든 설정은 환경변수(.env)에서 읽습니다. 값의 의미는 server/.env.example 을 참고하세요.
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const bool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const list = (value) =>
  String(value || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`필수 환경변수가 없습니다: ${missing.join(', ')} (server/.env.example 참고)`);
  }
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET 은 32자 이상의 임의 문자열이어야 합니다.');
  }

  const appOrigin = (env.APP_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '');

  return {
    env: nodeEnv,
    isProd,
    // 기본은 이 컴퓨터 안에서만 접속 가능(127.0.0.1). 운영에서도 Caddy 가 앞에서 받아 넘겨 주므로 그대로 둡니다.
    host: env.HOST || '127.0.0.1',
    port: Number(env.PORT || 4000),
    databaseUrl: env.DATABASE_URL,
    migrateOnStart: bool(env.MIGRATE_ON_START, true),
    trustProxy: env.TRUST_PROXY ?? (isProd ? '1' : 'loopback'),

    // 프론트엔드 주소. 비밀번호 재설정 메일 링크·CORS·CSRF(Origin) 검사에 사용합니다.
    appOrigin,
    allowedOrigins: [appOrigin, ...list(env.EXTRA_ALLOWED_ORIGINS)],

    jwtSecret: env.JWT_SECRET,
    session: {
      cookieName: env.SESSION_COOKIE_NAME || 'srmq_session',
      ttlHours: Number(env.SESSION_TTL_HOURS || 12), // '로그인 유지' 미선택
      rememberDays: Number(env.SESSION_REMEMBER_DAYS || 14), // '로그인 유지' 선택
      secure: bool(env.COOKIE_SECURE, isProd),
      sameSite: (env.COOKIE_SAMESITE || 'lax').toLowerCase(), // lax | strict | none
      domain: env.COOKIE_DOMAIN || undefined,
    },

    toss: {
      clientKey: env.TOSS_CLIENT_KEY || '', // test_gck_... / live_gck_... (결제위젯 연동 키)
      secretKey: env.TOSS_SECRET_KEY || '', // test_gsk_... / live_gsk_...
      apiBase: (env.TOSS_API_BASE || 'https://api.tosspayments.com').replace(/\/+$/, ''),
    },

    // 0원 테스트 결제: 사업자등록(PG 계약) 없이 결제 흐름을 시험할 때만 켭니다. 실제 오픈 전 반드시 끄기
    testPayment: {
      enabled: bool(env.TEST_PAYMENT_ENABLED, false),
    },

    bank: {
      name: env.BANK_NAME || 'KB국민은행',
      accountNumber: env.BANK_ACCOUNT_NUMBER || '821301-00-058386',
      holder: env.BANK_ACCOUNT_HOLDER || '(사)사회적책임경영품질원',
      dueDays: Number(env.BANK_TRANSFER_DUE_DAYS || 7),
    },

    uploads: {
      dir: path.resolve(env.UPLOAD_DIR || 'uploads'),
      publicBase: (env.PUBLIC_UPLOAD_BASE || '/uploads').replace(/\/+$/, ''),
      maxFileMb: Number(env.UPLOAD_MAX_MB || 15),
    },

    mail: {
      host: env.SMTP_HOST || '',
      port: Number(env.SMTP_PORT || 587),
      secure: bool(env.SMTP_SECURE, false),
      user: env.SMTP_USER || '',
      pass: env.SMTP_PASS || '',
      from: env.MAIL_FROM || '사회적책임경영품질원 <srmq@srmq.or.kr>',
      adminNotify: env.ADMIN_NOTIFY_EMAIL || '',
    },

    schedulerEnabled: bool(env.SCHEDULER_ENABLED, true),
  };
}
