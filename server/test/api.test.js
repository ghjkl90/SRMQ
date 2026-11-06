// test/api.test.js — 회원 · 결제 · 관리자 · 갤러리 · 탈퇴 전체 흐름 통합 테스트
// 실행: TEST_DATABASE_URL=postgres://.../srmq_test npm test
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { hashPassword, newCustomerKey } from '../src/lib/security.js';
import { expireStaleOrders } from '../src/services/orders.js';
import { cleanupUploads } from '../src/services/gallery.js';
import { createStorage } from '../src/services/storage.js';
import { corporateSignup, individualSignup, startTestApp } from './helpers.js';

let ctx;
const member = () => ctx.member;
const admin = () => ctx.admin;

before(async () => {
  ctx = await startTestApp();
  ctx.member = ctx.client();
  ctx.admin = ctx.client();
  // 관리자 계정은 스크립트 대신 직접 생성
  await ctx.db.query(
    `INSERT INTO users (email, password_hash, role, member_type, name, phone, affiliation, terms_agreed_at, privacy_agreed_at, customer_key)
     VALUES ('admin@srmq.or.kr', $1, 'ADMIN', 'INDIVIDUAL', '사무국', '', '사경원', now(), now(), $2)`,
    [await hashPassword('Admin!2026'), newCustomerKey()],
  );
});

after(async () => {
  await ctx?.close();
});

describe('회원등급', () => {
  test('8개 등급이 회원 안내 페이지 금액대로 등록되어 있다', async () => {
    const { status, data } = await ctx.client().get('/api/plans');
    assert.equal(status, 200);
    assert.equal(data.plans.length, 8);
    const byCode = Object.fromEntries(data.plans.map((p) => [p.code, p]));
    assert.deepEqual([byCode.ASSOCIATE.joinFee, byCode.ASSOCIATE.annualFee], [50000, 0]);
    assert.deepEqual([byCode.REGULAR.joinFee, byCode.REGULAR.annualFee], [100000, 50000]);
    assert.deepEqual([byCode.LIFETIME.joinFee, byCode.LIFETIME.annualFee], [500000, 0]);
    assert.deepEqual([byCode.GROUP.joinFee, byCode.GROUP.annualFee], [0, 100000]);
    assert.equal(byCode.NES.annualFee, 2000000);
    assert.equal(byCode.BES.annualFee, 3000000);
    assert.equal(byCode.GES.annualFee, 5000000);
    assert.equal(byCode.SPECIAL.annualFee, 10000000);
    assert.equal(byCode.SPECIAL.category, 'SPECIAL');
  });
});

describe('회원가입 · 로그인', () => {
  test('비밀번호 규칙 · 필수 약관 · 비밀번호 확인을 검사한다', async () => {
    const r1 = await ctx.client().post('/api/auth/signup', individualSignup({ password: 'abcdefgh', passwordConfirm: 'abcdefgh' }));
    assert.equal(r1.status, 400);
    assert.match(r1.data.error.fields.password, /영문, 숫자, 특수문자/);

    const r2 = await ctx.client().post('/api/auth/signup', individualSignup({ agreements: { terms: false, privacy: true } }));
    assert.equal(r2.status, 400);
    assert.ok(r2.data.error.fields['agreements.terms']);

    const r3 = await ctx.client().post('/api/auth/signup', individualSignup({ passwordConfirm: 'Srmq!2027' }));
    assert.equal(r3.status, 400);
    assert.equal(r3.data.error.fields.passwordConfirm, '비밀번호가 일치하지 않습니다.');
  });

  test('개인 회원가입 → 자동 로그인, 회비 미납(NONE) 상태로 시작', async () => {
    const { status, data } = await member().post('/api/auth/signup', individualSignup());
    assert.equal(status, 201);
    assert.equal(data.user.email, 'hong@example.com');
    assert.equal(data.user.phone, '010-1234-5678');
    assert.equal(data.user.membership.status, 'NONE');
    assert.equal(data.user.membership.planCode, 'REGULAR');
    assert.ok(member().cookies.has('srmq_session'));

    const me = await member().get('/api/auth/me');
    assert.equal(me.data.user.name, '홍길동');
  });

  test('이메일 중복확인 · 중복 가입 거절', async () => {
    const taken = await ctx.client().get('/api/auth/check-email?email=HONG@example.com');
    assert.equal(taken.data.available, false);
    const free = await ctx.client().get('/api/auth/check-email?email=new@example.com');
    assert.equal(free.data.available, true);
    const dup = await ctx.client().post('/api/auth/signup', individualSignup());
    assert.equal(dup.status, 409);
    assert.equal(dup.data.error.code, 'EMAIL_TAKEN');
  });

  test('기업회원: 사업자번호 필수, 등급과 회원구분이 맞아야 한다', async () => {
    const noBiz = await ctx.client().post('/api/auth/signup', corporateSignup({ businessNo: '' }));
    assert.equal(noBiz.status, 400);
    assert.ok(noBiz.data.error.fields.businessNo);

    const mismatch = await ctx.client().post('/api/auth/signup', individualSignup({ email: 'x@example.com', planCode: 'NES' }));
    assert.equal(mismatch.status, 400);
  });

  test('로그아웃 · 잘못된 비밀번호 · 다시 로그인', async () => {
    const c = ctx.client();
    const bad = await c.post('/api/auth/login', { email: 'hong@example.com', password: 'Wrong!123' });
    assert.equal(bad.status, 401);
    const ok = await c.post('/api/auth/login', { email: 'hong@example.com', password: 'Srmq!2026', remember: true });
    assert.equal(ok.status, 200);
    assert.equal((await c.get('/api/auth/me')).data.user.email, 'hong@example.com');
    await c.post('/api/auth/logout', {});
    assert.equal((await c.get('/api/auth/me')).data.user, null);

    const adminLogin = await admin().post('/api/auth/login', { email: 'admin@srmq.or.kr', password: 'Admin!2026' });
    assert.equal(adminLogin.data.user.role, 'ADMIN');
  });

  test('다른 사이트(Origin)에서 온 변경 요청은 거절한다 (CSRF)', async () => {
    const r = await member().post('/api/me/password', { currentPassword: 'x', newPassword: 'y', newPasswordConfirm: 'y' }, { origin: 'https://evil.example' });
    assert.equal(r.status, 403);
    assert.equal(r.data.error.code, 'BAD_ORIGIN');
  });
});

describe('무통장입금 → 관리자 입금확인', () => {
  test('정회원 신규 견적 = 입회비 100,000 + 연회비 50,000', async () => {
    const { data } = await member().get('/api/plans/REGULAR/quote');
    assert.equal(data.quote.orderType, 'NEW');
    assert.equal(data.quote.amount, 150000);
    assert.deepEqual(data.quote.items.map((i) => i.type), ['JOIN_FEE', 'ANNUAL_FEE']);
  });

  test('무통장 주문 생성 → 입금 대기 + 안내 메일 + 사무국 알림', async () => {
    const { status, data } = await member().post('/api/orders', {
      planCode: 'REGULAR',
      method: 'BANK_TRANSFER',
      depositorName: '홍길동',
      receiptType: 'CASH_RECEIPT',
      receiptInfo: { purpose: 'INCOME_DEDUCTION', identifier: '010-1234-5678' },
    });
    assert.equal(status, 201);
    assert.equal(data.order.status, 'WAITING_FOR_DEPOSIT');
    assert.equal(data.order.amount, 150000);
    assert.equal(data.order.bankAccount.accountNumber, '821301-00-058386');
    assert.match(data.order.orderNo, /^SRMQ-\d{8}-[A-Z0-9]{10}$/);
    ctx.bankOrderNo = data.order.orderNo;

    const subjects = ctx.mailer.outbox.map((m) => `${m.to}|${m.subject}`);
    assert.ok(subjects.some((s) => s.startsWith('hong@example.com|[사경원] 회비 무통장입금 안내')));
    assert.ok(subjects.some((s) => s.startsWith('office@srmq.test|[사경원 관리자] 무통장입금 신청')));
  });

  test('0원 테스트 결제는 기본으로 꺼져 있다', async () => {
    assert.equal((await ctx.client().get('/api/payments/config')).data.testPayment, false);
    const r = await member().post('/api/orders', { planCode: 'REGULAR', method: 'TEST' });
    assert.equal(r.status, 403);
    assert.equal(r.data.error.code, 'TEST_PAYMENT_DISABLED');
  });

  test('입금 대기 주문이 있으면 새 주문을 막는다', async () => {
    const { status, data } = await member().post('/api/orders', { planCode: 'REGULAR', method: 'BANK_TRANSFER' });
    assert.equal(status, 409);
    assert.equal(data.error.code, 'PENDING_ORDER_EXISTS');
    assert.equal(data.error.orderNo, ctx.bankOrderNo);
  });

  test('일반 회원은 관리자 API 에 접근할 수 없다', async () => {
    assert.equal((await member().get('/api/admin/orders')).status, 403);
    assert.equal((await ctx.client().get('/api/admin/orders')).status, 401);
  });

  test('관리자 입금확인 → 결제완료, 정회원 자격 1년 반영', async () => {
    const list = await admin().get('/api/admin/orders?status=WAITING_FOR_DEPOSIT');
    assert.ok(list.data.orders.some((o) => o.orderNo === ctx.bankOrderNo && o.user.email === 'hong@example.com'));

    const before = ctx.mailer.outbox.length;
    const r = await admin().post(`/api/admin/orders/${ctx.bankOrderNo}/confirm-deposit`, { memo: '11/3 입금 확인' });
    assert.equal(r.status, 200);
    assert.equal(r.data.order.status, 'PAID');

    const me = (await member().get('/api/me')).data.user;
    assert.equal(me.membership.status, 'ACTIVE');
    assert.equal(me.membership.planCode, 'REGULAR');
    const days = (new Date(me.membership.expiresAt) - Date.now()) / 864e5;
    assert.ok(days > 364 && days < 367, `만료일 ${me.membership.expiresAt}`);
    assert.ok(ctx.mailer.outbox.slice(before).some((m) => m.subject.includes('결제가 완료')));
  });

  test('갱신은 만료 90일 전부터만 가능하다', async () => {
    const r = await member().get('/api/plans/REGULAR/quote');
    assert.equal(r.status, 409);
    assert.equal(r.data.error.code, 'RENEWAL_NOT_OPEN');
  });
});

describe('토스페이먼츠 (카드 · 간편결제 · 가상계좌)', () => {
  test('종신회원으로 등급 변경: 금액 위변조는 거절하고 주문을 실패 처리', async () => {
    const created = await member().post('/api/orders', { planCode: 'LIFETIME', method: 'TOSS' });
    assert.equal(created.status, 201);
    assert.equal(created.data.toss.amount, 500000);
    assert.equal(created.data.toss.orderId, created.data.order.orderNo);
    assert.equal(created.data.toss.customerMobilePhone, '01012345678');
    assert.equal(created.data.order.orderType, 'CHANGE');

    const tampered = await member().post('/api/payments/toss/confirm', {
      paymentKey: 'pk_card_tamper',
      orderId: created.data.toss.orderId,
      amount: 100,
    });
    assert.equal(tampered.status, 400);
    const order = (await member().get(`/api/orders/${created.data.toss.orderId}`)).data.order;
    assert.equal(order.status, 'FAILED');
  });

  test('카드사 거절 → 실패 사유 저장', async () => {
    const created = await member().post('/api/orders', { planCode: 'LIFETIME', method: 'TOSS' });
    const r = await member().post('/api/payments/toss/confirm', {
      paymentKey: 'pk_fail_1',
      orderId: created.data.toss.orderId,
      amount: created.data.toss.amount,
    });
    assert.equal(r.status, 400);
    assert.equal(r.data.error.code, 'REJECT_CARD_COMPANY');
  });

  test('간편결제(카카오페이) 승인 → 종신회원, 새로고침(중복 승인)에도 안전', async () => {
    const created = await member().post('/api/orders', { planCode: 'LIFETIME', method: 'TOSS' });
    const body = { paymentKey: 'pk_kakao_1', orderId: created.data.toss.orderId, amount: created.data.toss.amount };
    const r = await member().post('/api/payments/toss/confirm', body);
    assert.equal(r.status, 200);
    assert.equal(r.data.order.status, 'PAID');
    assert.equal(r.data.order.payMethodLabel, '간편결제(카카오페이)');
    ctx.lifetimeOrderNo = body.orderId;

    const again = await member().post('/api/payments/toss/confirm', body);
    assert.equal(again.status, 200);
    assert.equal(again.data.order.status, 'PAID');

    const me = (await member().get('/api/me')).data.user;
    assert.equal(me.membership.planCode, 'LIFETIME');
    assert.equal(me.membership.expiresAt, null);
    assert.equal((await member().get('/api/plans/LIFETIME/quote')).data.error.code, 'ALREADY_MEMBER');
  });

  test('관리자 결제취소 → 토스 환불 + 이전 자격(정회원)으로 복구', async () => {
    const r = await admin().post(`/api/admin/orders/${ctx.lifetimeOrderNo}/cancel`, { reason: '회원 요청 환불' });
    assert.equal(r.status, 200);
    assert.equal(r.data.order.status, 'CANCELED');
    assert.equal(ctx.toss.payments.get('pk_kakao_1').status, 'CANCELED');
    const me = (await member().get('/api/me')).data.user;
    assert.equal(me.membership.planCode, 'REGULAR');
    assert.equal(me.membership.status, 'ACTIVE');
  });

  test('기업회원 가상계좌: 입금 전 대기 → 입금 웹훅(secret 검증) → 내셔널 ESG 자격', async () => {
    const corp = ctx.client();
    const signup = await corp.post('/api/auth/signup', corporateSignup());
    assert.equal(signup.status, 201);
    assert.equal(signup.data.user.businessNo, '123-45-67890');

    const created = await corp.post('/api/orders', { planCode: 'NES', method: 'TOSS' });
    assert.equal(created.data.toss.amount, 2000000);
    assert.equal(created.data.toss.customerName, '(주)한국사회적책임');
    const orderId = created.data.toss.orderId;

    const confirm = await corp.post('/api/payments/toss/confirm', { paymentKey: 'pk_va_1', orderId, amount: 2000000 });
    assert.equal(confirm.status, 200);
    assert.equal(confirm.data.order.status, 'WAITING_FOR_DEPOSIT');
    assert.equal(confirm.data.order.virtualAccount.bankName, '신한은행');
    assert.equal((await corp.get('/api/me')).data.user.membership.status, 'NONE');

    const forged = await ctx.client().post('/api/payments/toss/webhook', { createdAt: 'x', secret: 'forged', status: 'DONE', orderId }, { origin: null });
    assert.equal(forged.status, 200);
    assert.equal((await corp.get(`/api/orders/${orderId}`)).data.order.status, 'WAITING_FOR_DEPOSIT');

    ctx.toss.deposit('pk_va_1');
    const real = await ctx.client().post(
      '/api/payments/toss/webhook',
      { createdAt: 'x', secret: 'sec_pk_va_1', status: 'DONE', transactionKey: 't1', orderId },
      { origin: null },
    );
    assert.equal(real.status, 200);
    const me = (await corp.get('/api/me')).data.user;
    assert.equal(me.membership.status, 'ACTIVE');
    assert.equal(me.membership.planCode, 'NES');
    ctx.corp = corp;
  });

  test('PAYMENT_STATUS_CHANGED 웹훅은 토스에 다시 조회해 반영한다', async () => {
    ctx.toss.payments.get('pk_va_1').status = 'CANCELED';
    const r = await ctx.client().post(
      '/api/payments/toss/webhook',
      { eventType: 'PAYMENT_STATUS_CHANGED', createdAt: 'x', data: { paymentKey: 'pk_va_1', status: 'DONE' } },
      { origin: null },
    );
    assert.equal(r.status, 200);
    const me = (await ctx.corp.get('/api/me')).data.user;
    assert.equal(me.membership.status, 'NONE');
  });
});

describe('마이페이지', () => {
  test('회원정보 수정 · 형식 오류', async () => {
    const ok = await member().patch('/api/me', { name: '홍길순', department: '지속가능경영팀', marketingOptIn: true });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.user.name, '홍길순');
    assert.equal(ok.data.user.marketingOptIn, true);
    const bad = await member().patch('/api/me', { phone: '12345' });
    assert.equal(bad.status, 400);
  });

  test('비밀번호 변경: 현재 기기는 유지, 이전 비밀번호는 사용 불가', async () => {
    const wrong = await member().post('/api/me/password', { currentPassword: 'nope', newPassword: 'New!2026a', newPasswordConfirm: 'New!2026a' });
    assert.equal(wrong.status, 400);
    const r = await member().post('/api/me/password', { currentPassword: 'Srmq!2026', newPassword: 'New!2026a', newPasswordConfirm: 'New!2026a' });
    assert.equal(r.status, 200);
    assert.equal((await member().get('/api/me')).status, 200);
    assert.equal((await ctx.client().post('/api/auth/login', { email: 'hong@example.com', password: 'Srmq!2026' })).status, 401);
    assert.equal((await ctx.client().post('/api/auth/login', { email: 'hong@example.com', password: 'New!2026a' })).status, 200);
  });

  test('비밀번호 찾기 → 메일 링크 → 재설정 (1회용)', async () => {
    const c = ctx.client();
    const r = await c.post('/api/auth/password/forgot', { email: 'hong@example.com' });
    assert.equal(r.status, 200);
    const unknown = await c.post('/api/auth/password/forgot', { email: 'nobody@example.com' });
    assert.equal(unknown.status, 200);

    const mail = [...ctx.mailer.outbox].reverse().find((m) => m.subject.includes('비밀번호 재설정'));
    const token = decodeURIComponent(mail.text.match(/token=([^\s]+)/)[1]);
    const reset = await c.post('/api/auth/password/reset', { token, password: 'Reset!2026', passwordConfirm: 'Reset!2026' });
    assert.equal(reset.status, 200);
    assert.equal((await c.post('/api/auth/login', { email: 'hong@example.com', password: 'Reset!2026' })).status, 200);
    const reuse = await c.post('/api/auth/password/reset', { token, password: 'Again!2026', passwordConfirm: 'Again!2026' });
    assert.equal(reuse.status, 400);
    // 재설정으로 기존 로그인은 모두 끊김
    assert.equal((await member().get('/api/me')).status, 401);
    await member().post('/api/auth/login', { email: 'hong@example.com', password: 'Reset!2026' });
  });

  test('내 결제내역', async () => {
    const { data } = await member().get('/api/orders');
    assert.ok(data.orders.length >= 4);
    assert.ok(data.orders.some((o) => o.status === 'PAID' && o.method === 'BANK_TRANSFER'));
  });
});

describe('관리자: 회원 관리', () => {
  test('회원 목록 검색 · 수동 자격 부여 · CSV 내보내기', async () => {
    const list = await admin().get('/api/admin/members?q=한국사회적책임');
    assert.equal(list.status, 200);
    assert.equal(list.data.members.length, 1);
    const corpId = list.data.members[0].id;

    const r = await admin().patch(`/api/admin/members/${corpId}/membership`, {
      planCode: 'GES',
      status: 'ACTIVE',
      expiresAt: '2027-12-31',
      memo: '오프라인 납부 회원 이관',
    });
    assert.equal(r.status, 200);
    const me = (await ctx.corp.get('/api/me')).data.user;
    assert.equal(me.membership.planCode, 'GES');
    assert.equal(me.membership.status, 'ACTIVE');

    // 회원이 수식처럼 보이는 값을 넣어도 엑셀에서 실행되지 않아야 함
    await ctx.client().post('/api/auth/signup', individualSignup({ email: 'formula@example.com', affiliation: '=HYPERLINK("http://evil")' }));

    const res = await fetch(`${ctx.baseUrl}/api/admin/members/export.csv`, { headers: { Cookie: admin().cookieHeader() } });
    assert.equal(res.status, 200);
    const bytes = new Uint8Array(await res.arrayBuffer());
    assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf]); // 엑셀 한글 깨짐 방지 BOM
    const csv = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
    assert.ok(csv.startsWith('﻿가입일,아이디(이메일)'));
    assert.ok(csv.includes('(주)한국사회적책임'));
    assert.ok(csv.includes(`"'=HYPERLINK(""http://evil"")"`), '수식 주입 값 앞에 \' 가 붙어야 함');
    assert.match(res.headers.get('content-disposition'), /filename\*=UTF-8''/);

    const summary = await admin().get('/api/admin/summary');
    assert.ok(summary.data.activeMembers >= 2);
  });

  test('기한이 지난 무통장 주문은 스케줄러가 만료 처리', async () => {
    const created = await ctx.corp.post('/api/orders', { planCode: 'BES', method: 'BANK_TRANSFER', depositorName: '한국사회적책임' });
    assert.equal(created.status, 201);
    await ctx.db.query(`UPDATE orders SET deposit_due_at = now() - interval '1 hour' WHERE order_no = $1`, [created.data.order.orderNo]);
    const result = await expireStaleOrders(ctx.db);
    assert.equal(result.bank, 1);
    assert.equal((await ctx.corp.get(`/api/orders/${created.data.order.orderNo}`)).data.order.status, 'EXPIRED');
  });
});

describe('포상갤러리 관리', () => {
  const jpeg = () =>
    sharp({ create: { width: 3000, height: 2000, channels: 3, background: { r: 116, g: 184, b: 22 } } }).jpeg().toBuffer();

  async function upload(client, buffer, type = 'image/jpeg', name = 'photo.jpg') {
    const form = new FormData();
    form.append('file', new Blob([buffer], { type }), name);
    return client.request('POST', '/api/admin/uploads', { form });
  }

  test('일반 회원은 업로드할 수 없다', async () => {
    const r = await upload(member(), await jpeg());
    assert.equal(r.status, 403);
  });

  test('이미지 업로드 → 2000px · 썸네일 800px 로 변환 저장', async () => {
    const r = await upload(admin(), await jpeg());
    assert.equal(r.status, 201);
    assert.equal(r.data.width, 2000);
    assert.match(r.data.imageKey, /^gallery\/\d{4}\/\d{2}\/[\w-]+\.jpg$/);
    await access(path.join(ctx.uploadDir, r.data.imageKey));
    const thumbMeta = await sharp(path.join(ctx.uploadDir, r.data.imageKey.replace('.jpg', '_thumb.jpg'))).metadata();
    assert.equal(thumbMeta.width, 800);
    ctx.photo1 = r.data.imageKey;
    ctx.photo2 = (await upload(admin(), await jpeg())).data.imageKey;

    const notImage = await upload(admin(), Buffer.from('hello'), 'text/plain', 'a.txt');
    assert.equal(notImage.status, 400);
  });

  test('앨범 등록 → 공개 목록에 표시, 비공개 앨범은 관리자만', async () => {
    const created = await admin().post('/api/admin/gallery/albums', {
      year: 2026,
      title: '2026년 SRMQ 컨벤션 사진',
      isPublished: true,
      sections: [
        { title: null, photos: [{ imageKey: ctx.photo1, caption: '대회사 – 신완선 회장님' }] },
        { title: '국가경영대상 시상식', photos: [{ imageKey: ctx.photo2, caption: '전체 수상기업 기념 촬영' }] },
      ],
    });
    assert.equal(created.status, 201);
    ctx.albumId = created.data.album.id;
    assert.equal(created.data.album.sections[1].photos[0].thumbUrl.endsWith('_thumb.jpg'), true);

    await admin().post('/api/admin/gallery/albums', { year: 2027, title: '임시저장 앨범', isPublished: false, sections: [{ title: null, photos: [] }] });

    const pub = await ctx.client().get('/api/gallery');
    assert.equal(pub.data.albums.length, 1);
    assert.equal(pub.data.albums[0].sections[0].photos[0].caption, '대회사 – 신완선 회장님');

    const drafts = await admin().get('/api/gallery?drafts=1');
    assert.equal(drafts.data.albums.length, 2);
    const memberDrafts = await member().get('/api/gallery?drafts=1');
    assert.equal(memberDrafts.data.albums.length, 1);

    const img = await fetch(`${ctx.baseUrl}${pub.data.albums[0].sections[0].photos[0].url}`);
    assert.equal(img.status, 200);
    assert.equal(img.headers.get('content-type'), 'image/jpeg');
  });

  test('앨범 수정으로 뺀 사진은 24시간 뒤 정리 대상, 앨범 삭제', async () => {
    const r = await admin().put(`/api/admin/gallery/albums/${ctx.albumId}`, {
      year: 2026,
      title: '2026년 SRMQ 컨벤션',
      isPublished: true,
      sections: [{ title: null, photos: [{ imageKey: ctx.photo1, caption: '캡션 수정' }] }],
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.album.title, '2026년 SRMQ 컨벤션');
    const up = await ctx.db.query('SELECT attached FROM uploads WHERE key = $1', [ctx.photo2]);
    assert.equal(up.rows[0].attached, false);

    await ctx.db.query(`UPDATE uploads SET detached_at = now() - interval '25 hours' WHERE key = $1`, [ctx.photo2]);
    const storage = createStorage(ctx.config.uploads);
    assert.equal(await cleanupUploads(ctx.db, storage), 1);
    await assert.rejects(access(path.join(ctx.uploadDir, ctx.photo2)));

    const bogus = await admin().put(`/api/admin/gallery/albums/${ctx.albumId}`, {
      year: 2026, title: 'x', sections: [{ title: null, photos: [{ imageKey: 'gallery/2026/01/nope.jpg' }] }],
    });
    assert.equal(bogus.status, 400);

    assert.equal((await admin().delete(`/api/admin/gallery/albums/${ctx.albumId}`)).status, 200);
    assert.equal((await ctx.client().get('/api/gallery')).data.albums.length, 0);
  });
});

describe('회원탈퇴', () => {
  test('비밀번호 확인 · 개인정보 삭제 · 30일 재가입 제한 · 결제기록 보존', async () => {
    const wrong = await member().post('/api/me/withdraw', { password: 'x', reason: 'LOW_USAGE', agreed: true });
    assert.equal(wrong.status, 400);
    const noAgree = await member().post('/api/me/withdraw', { password: 'Reset!2026', reason: 'LOW_USAGE' });
    assert.equal(noAgree.status, 400);

    const { rows: [before] } = await ctx.db.query(`SELECT id FROM users WHERE email = 'hong@example.com'`);
    const r = await member().post('/api/me/withdraw', { password: 'Reset!2026', reason: 'LACK_OF_INFO', feedback: '교육 일정이 더 많았으면 합니다.', agreed: true });
    assert.equal(r.status, 200);
    assert.equal((await member().get('/api/me')).status, 401);
    assert.equal((await ctx.client().post('/api/auth/login', { email: 'hong@example.com', password: 'Reset!2026' })).status, 401);

    const { rows: [user] } = await ctx.db.query('SELECT * FROM users WHERE id = $1', [before.id]);
    assert.equal(user.status, 'WITHDRAWN');
    assert.equal(user.name, '탈퇴회원');
    assert.equal(user.phone, '');
    const orders = await ctx.db.query('SELECT count(*)::int AS n FROM orders WHERE user_id = $1', [before.id]);
    assert.ok(orders.rows[0].n >= 4);

    const rejoin = await ctx.client().post('/api/auth/signup', individualSignup());
    assert.equal(rejoin.status, 409);
    assert.equal(rejoin.data.error.code, 'REJOIN_RESTRICTED');
  });

  test('관리자는 탈퇴할 수 없다', async () => {
    const r = await admin().post('/api/me/withdraw', { password: 'Admin!2026', reason: 'OTHER', agreed: true });
    assert.equal(r.status, 403);
  });
});

test('없는 API 는 JSON 404', async () => {
  const r = await ctx.client().get('/api/nope');
  assert.equal(r.status, 404);
  assert.equal(r.data.error.code, 'NOT_FOUND');
});
