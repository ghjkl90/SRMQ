// test/toss-access.test.js — 카드사 심사 기간의 테스트 키 허용 계정 · 고액 결제 한도
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
import { overTossLimit, tossAvailableFor } from '../src/lib/tossAccess.js';
import { corporateSignup, individualSignup, startTestApp } from './helpers.js';

let ctx;

before(async () => {
  // 테스트 키(test_gck_fake)가 붙어 있고, 심사용 계정만 카드 결제를 쓸 수 있는 상태
  ctx = await startTestApp({ env: { TOSS_TEST_ALLOWED_EMAILS: 'Reviewer@Example.com, corp@example.com' } });
  ctx.member = ctx.client();
  await ctx.member.post('/api/auth/signup', individualSignup({ email: 'member@example.com' }));
  ctx.reviewer = ctx.client();
  await ctx.reviewer.post('/api/auth/signup', individualSignup({ email: 'reviewer@example.com' }));
  ctx.corp = ctx.client();
  await ctx.corp.post('/api/auth/signup', corporateSignup({ email: 'corp@example.com' }));
});

after(async () => {
  await ctx?.close();
});

describe('테스트 키 기간: 허용 계정만 카드 · 간편결제', () => {
  test('일반 회원에게는 카드 결제가 꺼져 있고 클라이언트 키도 내려가지 않는다', async () => {
    const { data } = await ctx.member.get('/api/payments/config');
    assert.equal(data.tossEnabled, false);
    assert.equal(data.tossClientKey, null);
    assert.equal(data.tossMaxAmount, 5000000);
    const anonymous = await ctx.client().get('/api/payments/config');
    assert.equal(anonymous.data.tossEnabled, false);
  });

  test('일반 회원이 직접 카드 주문을 만들어도 거절', async () => {
    const r = await ctx.member.post('/api/orders', { planCode: 'REGULAR', method: 'TOSS' });
    assert.equal(r.status, 403);
    assert.equal(r.data.error.code, 'TOSS_NOT_AVAILABLE');
  });

  test('허용 계정(대소문자 무관)은 카드 결제를 쓸 수 있다', async () => {
    const { data } = await ctx.reviewer.get('/api/payments/config');
    assert.equal(data.tossEnabled, true);
    assert.equal(data.tossClientKey, 'test_gck_fake');
    const r = await ctx.reviewer.post('/api/orders', { planCode: 'REGULAR', method: 'TOSS' });
    assert.equal(r.status, 201);
    assert.equal(r.data.toss.amount, 150000);
  });
});

describe('고액 결제 한도 (기본 500만 원)', () => {
  test('글로벌 ESG(500만 원)는 카드로 결제할 수 없고 무통장입금은 된다', async () => {
    const card = await ctx.corp.post('/api/orders', { planCode: 'GES', method: 'TOSS' });
    assert.equal(card.status, 400);
    assert.equal(card.data.error.code, 'TOSS_AMOUNT_LIMIT');
    const bank = await ctx.corp.post('/api/orders', { planCode: 'GES', method: 'BANK_TRANSFER', depositorName: '한국사회적책임' });
    assert.equal(bank.status, 201);
    assert.equal(bank.data.order.amount, 5000000);
  });
});

describe('설정 판단', () => {
  const toss = { isConfigured: true };
  const user = { email: 'someone@example.com' };

  test('라이브 키로 바꾸면 허용 계정 목록은 무시', () => {
    const config = loadConfig({
      DATABASE_URL: 'postgres://x',
      JWT_SECRET: 'x'.repeat(40),
      TOSS_CLIENT_KEY: 'live_gck_abc',
      TOSS_SECRET_KEY: 'live_gsk_abc',
      TOSS_TEST_ALLOWED_EMAILS: 'reviewer@example.com',
    });
    assert.equal(tossAvailableFor(config, toss, user), true);
    assert.equal(tossAvailableFor(config, toss, null), true);
  });

  test('테스트 키 + 허용 목록 비움 = 모두 허용, 키가 없으면 모두 막음', () => {
    const base = { DATABASE_URL: 'postgres://x', JWT_SECRET: 'x'.repeat(40) };
    assert.equal(tossAvailableFor(loadConfig({ ...base, TOSS_CLIENT_KEY: 'test_gck_abc' }), toss, user), true);
    assert.equal(tossAvailableFor(loadConfig(base), { isConfigured: false }, user), false);
  });

  test('한도: 기본 500만 원 이상, 0 이면 제한 없음, 빈 값은 기본값', () => {
    const base = { DATABASE_URL: 'postgres://x', JWT_SECRET: 'x'.repeat(40) };
    const def = loadConfig(base);
    assert.equal(overTossLimit(def, 4999999), false);
    assert.equal(overTossLimit(def, 5000000), true);
    assert.equal(overTossLimit(loadConfig({ ...base, TOSS_MAX_AMOUNT: '0' }), 10000000), false);
    assert.equal(loadConfig({ ...base, TOSS_MAX_AMOUNT: '' }).toss.maxAmount, 5000000);
  });
});
