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
  test('모든 회원권은 1년이고, 일반 회원은 종신 → 정회원 → 준회원 → 단체 순서', async () => {
    const { plans } = (await ctx.client().get('/api/plans')).data;
    assert.deepEqual(plans.filter((p) => p.term !== 'ANNUAL').map((p) => p.code), []);
    const general = plans.filter((p) => p.category === 'GENERAL').map((p) => p.code);
    assert.deepEqual(general, ['LIFETIME', 'REGULAR', 'ASSOCIATE', 'GROUP']);
    const byCode = Object.fromEntries(plans.map((p) => [p.code, p]));
    assert.deepEqual([byCode.LIFETIME.joinFee, byCode.LIFETIME.annualFee], [0, 500000]);
    assert.deepEqual([byCode.ASSOCIATE.joinFee, byCode.ASSOCIATE.annualFee], [0, 50000]);
    assert.ok(!byCode.LIFETIME.benefits.some((b) => b.includes('10년')));
  });

  test('준회원 가입: 연회비 1년 결제 → 결제일부터 1년', async () => {
    const quote = (await ctx.member.get('/api/plans/ASSOCIATE/quote')).data.quote;
    assert.equal(quote.amount, 50000);
    assert.deepEqual(quote.items.map((i) => i.label), ['연회비 (1년)']);

    const paid = await ctx.member.post('/api/orders', { planCode: 'ASSOCIATE', method: 'TEST' });
    assert.equal(paid.status, 201);
    const me = (await ctx.member.get('/api/me')).data.user;
    assert.equal(me.membership.planCode, 'ASSOCIATE');
    const years = yearsLeft(me.membership.expiresAt);
    assert.ok(years > 0.99 && years < 1.01, `만료까지 ${years}년`);

    assert.equal((await ctx.member.get('/api/plans/ASSOCIATE/quote')).data.error.code, 'RENEWAL_NOT_OPEN');
  });

  test('만료 90일 이내: 연회비로 기존 만료일에서 1년 연장', async () => {
    await ctx.db.query(`UPDATE users SET membership_expires_at = now() + interval '30 days' WHERE email = 'term@example.com'`);
    const quote = (await ctx.member.get('/api/plans/ASSOCIATE/quote')).data.quote;
    assert.equal(quote.orderType, 'RENEWAL');
    assert.equal(quote.amount, 50000);
    assert.deepEqual(quote.items.map((i) => i.label), ['연회비 (1년 갱신)']);
    assert.match(quote.orderName, /연회비 갱신/);

    await ctx.member.post('/api/orders', { planCode: 'ASSOCIATE', method: 'TEST' });
    const me = (await ctx.member.get('/api/me')).data.user;
    const years = yearsLeft(me.membership.expiresAt);
    assert.ok(years > 1.07 && years < 1.1, `30일 남은 상태에서 1년 연장 → ${years}년`);
  });

  test('예전에 기한 없이 가진 자격은 다시 결제할 것이 없다', async () => {
    await ctx.db.query(`UPDATE users SET membership_expires_at = NULL WHERE email = 'term@example.com'`);
    assert.equal((await ctx.member.get('/api/plans/ASSOCIATE/quote')).data.error.code, 'ALREADY_MEMBER');
  });
});
