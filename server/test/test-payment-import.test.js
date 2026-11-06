// test/test-payment-import.test.js — 0원 테스트 결제 · 회원명부 이관
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, newCustomerKey } from '../src/lib/security.js';
import { importMembers, parseCsv, rowsToRecords } from '../src/services/memberImport.js';
import { individualSignup, startTestApp } from './helpers.js';

let ctx;

before(async () => {
  ctx = await startTestApp({ env: { TEST_PAYMENT_ENABLED: 'true' } });
  await ctx.db.query(
    `INSERT INTO users (email, password_hash, role, source, member_type, name, phone, affiliation, terms_agreed_at, privacy_agreed_at, customer_key)
     VALUES ('admin@srmq.or.kr', $1, 'ADMIN', 'ADMIN', 'INDIVIDUAL', '사무국', '', '사경원', now(), now(), $2)`,
    [await hashPassword('Admin!2026'), newCustomerKey()],
  );
  ctx.admin = ctx.client();
  await ctx.admin.post('/api/auth/login', { email: 'admin@srmq.or.kr', password: 'Admin!2026' });
  ctx.member = ctx.client();
  await ctx.member.post('/api/auth/signup', individualSignup({ email: 'tester@example.com' }));
});

after(async () => {
  await ctx?.close();
});

describe('0원 테스트 결제', () => {
  test('결제 설정에 테스트 결제가 켜져 있다고 알려 준다', async () => {
    const { data } = await ctx.client().get('/api/payments/config');
    assert.equal(data.testPayment, true);
  });

  test('정회원 0원 결제 → 바로 결제완료 · 자격 1년 반영 · 완료 메일', async () => {
    const before = ctx.mailer.outbox.length;
    const r = await ctx.member.post('/api/orders', { planCode: 'REGULAR', method: 'TEST' });
    assert.equal(r.status, 201);
    const o = r.data.order;
    assert.equal(o.status, 'PAID');
    assert.equal(o.method, 'TEST');
    assert.equal(o.amount, 0);
    assert.equal(o.payMethodLabel, '테스트 결제(0원)');
    assert.deepEqual(o.items.map((i) => i.amount), [100000, 50000, -150000]);
    ctx.testOrderNo = o.orderNo;

    const me = (await ctx.member.get('/api/me')).data.user;
    assert.equal(me.membership.status, 'ACTIVE');
    assert.equal(me.membership.planCode, 'REGULAR');
    const days = (new Date(me.membership.expiresAt) - Date.now()) / 864e5;
    assert.ok(days > 364 && days < 367);
    assert.ok(ctx.mailer.outbox.slice(before).some((m) => m.to === 'tester@example.com' && m.subject.includes('결제가 완료')));
  });

  test('기업회원 등급도 사업자등록번호 없이 0원으로 변경할 수 있다', async () => {
    const r = await ctx.member.post('/api/orders', { planCode: 'NES', method: 'TEST' });
    assert.equal(r.status, 201);
    assert.equal(r.data.order.amount, 0);
    ctx.nesOrderNo = r.data.order.orderNo;
    const me = (await ctx.member.get('/api/me')).data.user;
    assert.equal(me.membership.planCode, 'NES');
    assert.equal(me.memberType, 'ORGANIZATION');
    assert.equal(me.businessNo, null);
  });

  test('관리자가 테스트 결제를 취소하면 이전 자격(정회원)으로 돌아간다', async () => {
    const r = await ctx.admin.post(`/api/admin/orders/${ctx.nesOrderNo}/cancel`, { reason: '테스트 정리' });
    assert.equal(r.status, 200);
    assert.equal(r.data.order.status, 'CANCELED');
    const me = (await ctx.member.get('/api/me')).data.user;
    assert.equal(me.membership.planCode, 'REGULAR');
    assert.equal(me.membership.status, 'ACTIVE');
  });

  test('관리자 결제 목록에 테스트 결제가 0원으로 보인다', async () => {
    const { data } = await ctx.admin.get('/api/admin/orders');
    const o = data.orders.find((x) => x.orderNo === ctx.testOrderNo);
    assert.equal(o.method, 'TEST');
    assert.equal(o.amount, 0);
  });
});

describe('회원명부 이관', () => {
  const csv = [
    '﻿성명,이메일,휴대폰,소속,등급,자격시작,만료일,메모',
    '김명부,Kim.Roster@Example.com,01055556666,"사경원, 이사회",정회원,2026-10-31,2027-10-31,"2026 명부 · 이사"',
    '이메일없음,,010-1111-2222,무소속,,,,',
    '박기존,existing@example.com,010-3333-4444,한국대,,2026-10-31,2027-10-31,',
  ].join('\r\n');

  test('CSV 를 읽고(따옴표 · 쉼표 · BOM) 머리글을 맞춘다', () => {
    const records = rowsToRecords(parseCsv(csv));
    assert.equal(records.length, 3);
    assert.equal(records[0].affiliation, '사경원, 이사회');
    assert.equal(records[0].line, 2);
  });

  test('새 회원은 납부 완료로 등록, 이미 가입한 회원은 자격만 반영, 이메일 없는 행은 건너뜀', async () => {
    await ctx.client().post('/api/auth/signup', individualSignup({ email: 'existing@example.com', name: '박기존' }));
    const result = await importMembers(ctx.db, rowsToRecords(parseCsv(csv)));
    assert.deepEqual([result.created.length, result.updated.length, result.unchanged.length, result.skipped.length], [1, 1, 0, 1]);
    assert.match(result.skipped[0].reason, /이메일 없음/);

    const { rows } = await ctx.db.query(`SELECT * FROM users WHERE email = 'kim.roster@example.com'`);
    const u = rows[0];
    assert.equal(u.source, 'IMPORT');
    assert.equal(u.password_set, false);
    assert.equal(u.terms_agreed_at, null);
    assert.equal(u.plan_code, 'REGULAR');
    assert.equal(u.membership_status, 'ACTIVE');
    assert.equal(u.phone, '010-5555-6666');
    assert.equal(new Date(u.membership_expires_at).toISOString(), '2027-10-31T14:59:59.000Z'); // 2027-10-31 23:59:59 KST
    assert.match(u.admin_memo, /회원명부 이관 · 정회원 납부 확인 · 2026 명부 · 이사/);

    const existing = (await ctx.db.query(`SELECT * FROM users WHERE email = 'existing@example.com'`)).rows[0];
    assert.equal(existing.source, 'SIGNUP');
    assert.equal(existing.password_set, true);
    assert.equal(existing.membership_status, 'ACTIVE');
  });

  test('다시 실행해도 중복으로 만들지 않는다 · dry-run 은 저장하지 않는다', async () => {
    const again = await importMembers(ctx.db, rowsToRecords(parseCsv(csv)));
    assert.deepEqual([again.created.length, again.updated.length, again.unchanged.length], [0, 0, 2]);

    const extra = rowsToRecords(parseCsv('성명,이메일\r\n최미리,preview@example.com'));
    const dry = await importMembers(ctx.db, extra, { dryRun: true });
    assert.equal(dry.created.length, 1);
    const { rowCount } = await ctx.db.query(`SELECT 1 FROM users WHERE email = 'preview@example.com'`);
    assert.equal(rowCount, 0);
  });

  test('명부 CSV 를 고쳐 다시 실행하면(사이트 결제 전) 등급 · 기간이 반영된다', async () => {
    const fixed = csv.replace('정회원,2026-10-31,2027-10-31', '종신회원,2026-10-31,');
    const r = await importMembers(ctx.db, rowsToRecords(parseCsv(fixed)));
    assert.deepEqual([r.created.length, r.updated.length, r.unchanged.length], [0, 1, 1]);
    const u = (await ctx.db.query(`SELECT plan_code, membership_expires_at FROM users WHERE email = 'kim.roster@example.com'`)).rows[0];
    assert.equal(u.plan_code, 'LIFETIME');
    assert.equal(u.membership_expires_at, null);
  });

  test('명부 회원: 가입 · 로그인 대신 비밀번호 찾기로 안내한다', async () => {
    const c = ctx.client();
    const check = await c.get('/api/auth/check-email?email=kim.roster@example.com');
    assert.deepEqual(check.data, { available: false, imported: true });

    const signup = await c.post('/api/auth/signup', individualSignup({ email: 'kim.roster@example.com' }));
    assert.equal(signup.status, 409);
    assert.equal(signup.data.error.code, 'IMPORTED_MEMBER');

    const login = await c.post('/api/auth/login', { email: 'kim.roster@example.com', password: 'Whatever!1' });
    assert.equal(login.status, 401);
    assert.equal(login.data.error.code, 'PASSWORD_NOT_SET');
  });

  test('비밀번호 찾기 → 약관 동의와 함께 비밀번호 만들기 → 로그인, 자격 유지', async () => {
    const c = ctx.client();
    await c.post('/api/auth/password/forgot', { email: 'kim.roster@example.com' });
    const mail = [...ctx.mailer.outbox].reverse().find((m) => m.to === 'kim.roster@example.com');
    const token = decodeURIComponent(mail.text.match(/token=([^\s]+)/)[1]);

    const noConsent = await c.post('/api/auth/password/reset', { token, password: 'Roster!2026', passwordConfirm: 'Roster!2026' });
    assert.equal(noConsent.status, 400);
    assert.equal(noConsent.data.error.code, 'CONSENT_REQUIRED');

    const ok = await c.post('/api/auth/password/reset', {
      token,
      password: 'Roster!2026',
      passwordConfirm: 'Roster!2026',
      agreements: { terms: true, privacy: true },
    });
    assert.equal(ok.status, 200);

    const login = await c.post('/api/auth/login', { email: 'kim.roster@example.com', password: 'Roster!2026' });
    assert.equal(login.status, 200);
    assert.equal(login.data.user.membership.status, 'ACTIVE');
    const u = (await ctx.db.query(`SELECT password_set, terms_agreed_at, privacy_agreed_at FROM users WHERE email = 'kim.roster@example.com'`)).rows[0];
    assert.equal(u.password_set, true);
    assert.ok(u.terms_agreed_at && u.privacy_agreed_at);
  });

  test('관리자 회원 목록에 등록 경로와 비밀번호 설정 여부가 보인다', async () => {
    const { data } = await ctx.admin.get('/api/admin/members?q=example.com');
    const kim = data.members.find((m) => m.email === 'kim.roster@example.com');
    assert.equal(kim.source, 'IMPORT');
    assert.equal(kim.passwordSet, true);
  });
});
