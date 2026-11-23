// test/membership-terms.test.js — 회원권 이용 기간 (토스페이먼츠 심사: 기한 없는 회원권 불가)
//  준회원 · 종신회원은 1회 결제로 10년, 만료 90일 전부터 같은 금액으로 10년 연장
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { individualSignup, startTestApp } from './helpers.js';

let ctx;
const yearsLeft = (iso) => (new Date(iso) - Date.now()) / (365.25 * 864e5);

before(async () => {
  ctx = await startTestApp({ env: { TEST_PAYMENT_ENABLED: 'true' } });
  ctx.member = ctx.client();
  await ctx.member.post('/api/auth/signup', individualSignup({ email: 'term@example.com' }));
});

after(async () => {
  await ctx?.close();
});

describe('회원권 이용 기간', () => {
  test('기한 없는 회원권은 팔지 않고, 일반 회원은 종신 → 정회원 → 준회원 → 단체 순서', async () => {
    const { plans } = (await ctx.client().get('/api/plans')).data;
    assert.deepEqual(plans.map((p) => p.term).filter((t) => t !== 'ANNUAL' && t !== 'TEN_YEARS'), []);
    const general = plans.filter((p) => p.category === 'GENERAL').map((p) => p.code);
    assert.deepEqual(general, ['LIFETIME', 'REGULAR', 'ASSOCIATE', 'GROUP']);
    const byCode = Object.fromEntries(plans.map((p) => [p.code, p]));
    assert.equal(byCode.ASSOCIATE.term, 'TEN_YEARS');
    assert.equal(byCode.LIFETIME.term, 'TEN_YEARS');
    assert.equal(byCode.REGULAR.term, 'ANNUAL');
    assert.ok(byCode.LIFETIME.benefits.includes('연회비 없이 10년간 회원 자격 유지'));
  });

  test('준회원 가입: 입회비(10년) 1회 결제 → 결제일부터 10년', async () => {
    const quote = (await ctx.member.get('/api/plans/ASSOCIATE/quote')).data.quote;
    assert.equal(quote.amount, 50000);
    assert.deepEqual(quote.items.map((i) => i.label), ['입회비 (10년)']);

    const paid = await ctx.member.post('/api/orders', { planCode: 'ASSOCIATE', method: 'TEST' });
    assert.equal(paid.status, 201);
    const me = (await ctx.member.get('/api/me')).data.user;
    assert.equal(me.membership.planCode, 'ASSOCIATE');
    const years = yearsLeft(me.membership.expiresAt);
    assert.ok(years > 9.9 && years < 10.1, `만료까지 ${years}년`);

    // 만료가 많이 남았으면 연장 결제 불가
    assert.equal((await ctx.member.get('/api/plans/ASSOCIATE/quote')).data.error.code, 'RENEWAL_NOT_OPEN');
  });

  test('만료 90일 이내: 같은 금액으로 기존 만료일에서 10년 연장', async () => {
    await ctx.db.query(`UPDATE users SET membership_expires_at = now() + interval '30 days' WHERE email = 'term@example.com'`);
    const quote = (await ctx.member.get('/api/plans/ASSOCIATE/quote')).data.quote;
    assert.equal(quote.orderType, 'RENEWAL');
    assert.equal(quote.amount, 50000);
    assert.deepEqual(quote.items.map((i) => i.label), ['회비 (10년 연장)']);
    assert.match(quote.orderName, /기간 연장/);

    await ctx.member.post('/api/orders', { planCode: 'ASSOCIATE', method: 'TEST' });
    const me = (await ctx.member.get('/api/me')).data.user;
    const years = yearsLeft(me.membership.expiresAt);
    assert.ok(years > 10 && years < 10.2, `30일 남은 상태에서 10년 연장 → ${years}년`);
  });

  test('예전에 기한 없이 가진 자격은 다시 결제할 것이 없다', async () => {
    await ctx.db.query(`UPDATE users SET membership_expires_at = NULL WHERE email = 'term@example.com'`);
    assert.equal((await ctx.member.get('/api/plans/ASSOCIATE/quote')).data.error.code, 'ALREADY_MEMBER');
  });
});
