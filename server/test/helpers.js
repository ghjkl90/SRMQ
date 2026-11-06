// test/helpers.js — 실제 PostgreSQL + 가짜 토스 서버로 API 를 검증하기 위한 도구
import http from 'node:http';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from '../src/config.js';
import { createDb } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';
import { createApp } from '../src/app.js';
import { createTossClient } from '../src/services/toss.js';
import { createMailer } from '../src/services/mailer.js';
import { createStorage } from '../src/services/storage.js';

export const APP_ORIGIN = 'http://localhost:5173';

/** 토스페이먼츠 API 흉내: paymentKey 접두어로 결과를 정합니다. */
export function startFakeToss() {
  const payments = new Map();
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const json = body ? JSON.parse(body) : {};
    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Basic ')) return send(401, { code: 'UNAUTHORIZED_KEY', message: '인증 실패' });

    if (req.method === 'POST' && req.url === '/v1/payments/confirm') {
      const { paymentKey, orderId, amount } = json;
      if (paymentKey.startsWith('pk_fail')) return send(400, { code: 'REJECT_CARD_COMPANY', message: '카드사에서 거절했습니다.' });
      if (payments.has(paymentKey)) return send(400, { code: 'ALREADY_PROCESSED_PAYMENT', message: '이미 처리된 결제입니다.' });
      const isVa = paymentKey.startsWith('pk_va');
      const payment = {
        paymentKey,
        orderId,
        totalAmount: amount,
        status: isVa ? 'WAITING_FOR_DEPOSIT' : 'DONE',
        method: isVa ? '가상계좌' : paymentKey.startsWith('pk_kakao') ? '간편결제' : '카드',
        easyPay: paymentKey.startsWith('pk_kakao') ? { provider: '카카오페이' } : null,
        approvedAt: isVa ? null : new Date().toISOString(),
        receipt: { url: `https://dashboard.example/receipt/${paymentKey}` },
        virtualAccount: isVa
          ? { bankCode: '88', accountNumber: '56211234567890', customerName: '홍길동', dueDate: new Date(Date.now() + 3 * 864e5).toISOString() }
          : null,
        secret: isVa ? `sec_${paymentKey}` : null,
      };
      payments.set(paymentKey, payment);
      return send(200, payment);
    }

    const byKey = req.url.match(/^\/v1\/payments\/([^/]+)$/);
    if (req.method === 'GET' && byKey && !req.url.startsWith('/v1/payments/orders/')) {
      const p = payments.get(decodeURIComponent(byKey[1]));
      return p ? send(200, p) : send(404, { code: 'NOT_FOUND_PAYMENT', message: '없음' });
    }
    const byOrder = req.url.match(/^\/v1\/payments\/orders\/([^/]+)$/);
    if (req.method === 'GET' && byOrder) {
      const p = [...payments.values()].find((x) => x.orderId === decodeURIComponent(byOrder[1]));
      return p ? send(200, p) : send(404, { code: 'NOT_FOUND_PAYMENT', message: '없음' });
    }
    const cancel = req.url.match(/^\/v1\/payments\/([^/]+)\/cancel$/);
    if (req.method === 'POST' && cancel) {
      const p = payments.get(decodeURIComponent(cancel[1]));
      if (!p) return send(404, { code: 'NOT_FOUND_PAYMENT', message: '없음' });
      p.status = 'CANCELED';
      return send(200, p);
    }
    return send(404, { code: 'NOT_FOUND', message: req.url });
  });
  return new Promise((resolve) => {
    server.listen(0, () => {
      resolve({
        url: `http://127.0.0.1:${server.address().port}`,
        payments,
        /** 가상계좌 입금 완료를 흉내 냅니다. */
        deposit(paymentKey) {
          const p = payments.get(paymentKey);
          p.status = 'DONE';
          p.approvedAt = new Date().toISOString();
          return p;
        },
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

export async function startTestApp({ env = {} } = {}) {
  const toss = await startFakeToss();
  const uploadDir = await mkdtemp(path.join(os.tmpdir(), 'srmq-uploads-'));
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgres://srmq:srmq@localhost:5432/srmq_test',
    JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
    APP_ORIGIN,
    TOSS_CLIENT_KEY: 'test_gck_fake',
    TOSS_SECRET_KEY: 'test_gsk_fake',
    TOSS_API_BASE: toss.url,
    UPLOAD_DIR: uploadDir,
    ADMIN_NOTIFY_EMAIL: 'office@srmq.test',
    MIGRATE_ON_START: 'true',
    ...env,
  });

  const db = createDb(config.databaseUrl);
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await runMigrations(db, { log: () => {} });

  const mailer = createMailer(config.mail, { mode: 'memory' });
  const storage = createStorage(config.uploads);
  const tossClient = createTossClient(config.toss);
  const app = createApp({ config, db, toss: tossClient, mailer, storage, rateLimit: false, logRequests: false });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  return {
    baseUrl,
    config,
    db,
    mailer,
    toss,
    uploadDir,
    client: () => new TestClient(baseUrl),
    async close() {
      await new Promise((r) => server.close(r));
      await toss.close();
      await db.end();
    },
  };
}

/** 쿠키를 기억하는 간단한 HTTP 클라이언트 (브라우저처럼 Origin 헤더 전송) */
export class TestClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
  }

  cookieHeader() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async request(method, url, { json, form, origin = APP_ORIGIN, headers = {} } = {}) {
    const h = { ...headers };
    if (this.cookies.size) h.Cookie = this.cookieHeader();
    if (method !== 'GET' && origin) h.Origin = origin;
    let body;
    if (json !== undefined) {
      h['Content-Type'] = 'application/json';
      body = JSON.stringify(json);
    } else if (form) {
      body = form;
    }
    const res = await fetch(this.baseUrl + url, { method, headers: h, body });
    for (const c of res.headers.getSetCookie()) {
      const [pair, ...attrs] = c.split(';');
      const [name, ...v] = pair.split('=');
      const value = v.join('=');
      const expired = attrs.some((a) => /expires=thu, 01 jan 1970/i.test(a.trim())) || value === '';
      if (expired) this.cookies.delete(name.trim());
      else this.cookies.set(name.trim(), value);
    }
    const type = res.headers.get('content-type') || '';
    const data = type.includes('application/json') ? await res.json() : await res.text();
    return { status: res.status, data, headers: res.headers };
  }

  get(url, opts) {
    return this.request('GET', url, opts);
  }
  post(url, json, opts = {}) {
    return this.request('POST', url, { ...opts, json });
  }
  put(url, json, opts = {}) {
    return this.request('PUT', url, { ...opts, json });
  }
  patch(url, json, opts = {}) {
    return this.request('PATCH', url, { ...opts, json });
  }
  delete(url, opts = {}) {
    return this.request('DELETE', url, opts);
  }
}

export const individualSignup = (overrides = {}) => ({
  email: 'hong@example.com',
  password: 'Srmq!2026',
  passwordConfirm: 'Srmq!2026',
  memberType: 'INDIVIDUAL',
  planCode: 'REGULAR',
  name: '홍길동',
  phone: '01012345678',
  officePhone: '02-000-0000',
  affiliation: '서울대학교',
  department: 'ESG경영팀',
  position: '선임연구원',
  agreements: { terms: true, privacy: true, sms: true, marketing: false },
  ...overrides,
});

export const corporateSignup = (overrides = {}) => ({
  email: 'esg@company.co.kr',
  password: 'Corp#2026x',
  passwordConfirm: 'Corp#2026x',
  memberType: 'ORGANIZATION',
  planCode: 'NES',
  name: '김담당',
  phone: '010-2222-3333',
  companyName: '(주)한국사회적책임',
  businessNo: '1234567890',
  ceoName: '이대표',
  taxEmail: 'tax@company.co.kr',
  department: 'ESG팀',
  position: '팀장',
  agreements: { terms: true, privacy: true },
  ...overrides,
});
