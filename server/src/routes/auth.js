// src/routes/auth.js  →  /api/auth
import { Router } from 'express';
import { z } from 'zod';
import { HttpError, badRequest, conflict, forbidden } from '../lib/errors.js';
import { addDays, formatKstDate } from '../lib/dates.js';
import { hashPassword, newCustomerKey, randomToken, sha256, verifyPassword } from '../lib/security.js';
import {
  bizNoSchema,
  emailSchema,
  mobileSchema,
  nameSchema,
  optionalPhoneSchema,
  parse,
  passwordSchema,
  text,
} from '../lib/validation.js';
import { clearSession, issueSession } from '../middleware/auth.js';
import { getPlan } from '../services/plans.js';
import { findActiveUserByEmail, loadSerializedUser } from '../services/users.js';
import { passwordResetEmail } from '../services/emails.js';

const REJOIN_BLOCK_DAYS = 30;
const IMPORTED_MESSAGE =
  '회원명부에 등록된 이메일입니다. 로그인 화면의 비밀번호 찾기에서 이 이메일로 비밀번호를 만든 뒤 로그인해 주세요.';

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .nullable()
  .refine((v) => !v || z.email().safeParse(v).success, { message: '세금계산서 수신 이메일 형식이 올바르지 않습니다.' })
  .transform((v) => (v ? v : null));

const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string({ error: '비밀번호 확인을 입력해 주세요.' }),
    memberType: z.enum(['INDIVIDUAL', 'ORGANIZATION'], { error: '회원 구분을 선택해 주세요.' }),
    planCode: z.string({ error: '회원 유형을 선택해 주세요.' }).min(1, '회원 유형을 선택해 주세요.'),
    name: nameSchema,
    phone: mobileSchema,
    officePhone: optionalPhoneSchema,
    affiliation: text(80, '소속 기관/기업명'),
    department: text(60, '부서'),
    position: text(60, '직위'),
    companyName: text(80, '기업명'),
    businessNo: z.string().optional().nullable(),
    ceoName: text(40, '대표자명'),
    taxEmail: optionalEmail,
    agreements: z.object({
      terms: z.literal(true, { error: '사경원 이용약관에 동의해 주세요.' }),
      privacy: z.literal(true, { error: '개인정보 수집 및 이용에 동의해 주세요.' }),
      sms: z.boolean().optional().default(false),
      marketing: z.boolean().optional().default(false),
    }),
  })
  .superRefine((d, ctx) => {
    if (d.password !== d.passwordConfirm) {
      ctx.addIssue({ code: 'custom', path: ['passwordConfirm'], message: '비밀번호가 일치하지 않습니다.' });
    }
    if (d.memberType === 'INDIVIDUAL' && !d.affiliation) {
      ctx.addIssue({
        code: 'custom',
        path: ['affiliation'],
        message: "소속 기관/기업명을 입력해 주세요. (무소속이면 '개인')",
      });
    }
    if (d.memberType === 'ORGANIZATION') {
      if (!d.companyName) ctx.addIssue({ code: 'custom', path: ['companyName'], message: '기업명을 입력해 주세요.' });
      const biz = bizNoSchema.safeParse(d.businessNo ?? '');
      if (!biz.success) {
        ctx.addIssue({ code: 'custom', path: ['businessNo'], message: biz.error.issues[0].message });
      }
    }
  })
  .transform((d) => ({
    ...d,
    businessNo: d.memberType === 'ORGANIZATION' ? bizNoSchema.parse(d.businessNo) : null,
  }));

const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: '비밀번호를 입력해 주세요.' }).min(1, '비밀번호를 입력해 주세요.'),
  remember: z.boolean().optional().default(false),
});

const resetSchema = z
  .object({
    token: z.string().min(20, '잘못된 링크입니다.'),
    password: passwordSchema,
    passwordConfirm: z.string(),
    // 회원명부로 옮긴 계정은 처음 비밀번호를 만들 때 약관 동의를 받습니다
    agreements: z.object({ terms: z.boolean().optional(), privacy: z.boolean().optional() }).optional(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다.',
  });

let dummyHashPromise;
const dummyHash = () => (dummyHashPromise ??= hashPassword('dummy-password-for-timing!1'));

export default function authRoutes({ db, config, mailer, limits }) {
  const router = Router();

  // 아이디(이메일) 중복확인
  router.get('/check-email', limits.emailCheck, async (req, res) => {
    const email = parse(emailSchema, req.query.email);
    const { rows } = await db.query('SELECT password_set FROM users WHERE email = $1', [email]);
    res.json({ available: rows.length === 0, imported: rows.length > 0 && rows[0].password_set === false });
  });

  // 회원가입 → 자동 로그인
  router.post('/signup', limits.signup, async (req, res) => {
    const data = parse(signupSchema, req.body);
    const plan = await getPlan(db, data.planCode);

    if (plan.member_type === 'ORGANIZATION' && data.memberType !== 'ORGANIZATION') {
      throw badRequest('기업·특별회원은 기업회원 양식으로 가입해 주세요.', { planCode: '회원 구분과 유형이 맞지 않습니다.' });
    }
    if (plan.member_type === 'INDIVIDUAL' && data.memberType !== 'INDIVIDUAL') {
      throw badRequest('선택한 회원 유형은 일반회원 양식으로 가입해 주세요.', { planCode: '회원 구분과 유형이 맞지 않습니다.' });
    }

    const blocked = await db.query(
      `SELECT withdrawn_at FROM withdrawals
        WHERE email_hash = $1 AND withdrawn_at > now() - make_interval(days => $2)
        ORDER BY withdrawn_at DESC LIMIT 1`,
      [sha256(data.email), REJOIN_BLOCK_DAYS],
    );
    if (blocked.rows[0]) {
      const availableAt = addDays(blocked.rows[0].withdrawn_at, REJOIN_BLOCK_DAYS);
      throw conflict(
        'REJOIN_RESTRICTED',
        `탈퇴 후 ${REJOIN_BLOCK_DAYS}일 동안은 같은 이메일로 다시 가입할 수 없습니다. (${formatKstDate(availableAt)}부터 가능)`,
      );
    }

    const exists = await db.query('SELECT password_set FROM users WHERE email = $1', [data.email]);
    if (exists.rows[0]?.password_set === false) {
      throw new HttpError(409, 'IMPORTED_MEMBER', IMPORTED_MESSAGE, { email: IMPORTED_MESSAGE });
    }
    if (exists.rowCount) {
      throw new HttpError(409, 'EMAIL_TAKEN', '이미 가입된 이메일입니다.', { email: '이미 가입된 이메일입니다.' });
    }

    const passwordHash = await hashPassword(data.password);
    const { rows } = await db.query(
      `INSERT INTO users
         (email, password_hash, member_type, name, phone, office_phone, affiliation, department, position,
          company_name, business_no, ceo_name, tax_email, plan_code, sms_opt_in, marketing_opt_in,
          terms_agreed_at, privacy_agreed_at, customer_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now(), now(), $17)
       RETURNING *`,
      [
        data.email,
        passwordHash,
        data.memberType,
        data.name,
        data.phone,
        data.officePhone,
        data.memberType === 'ORGANIZATION' ? data.affiliation || data.companyName : data.affiliation,
        data.department,
        data.position,
        data.memberType === 'ORGANIZATION' ? data.companyName : null,
        data.businessNo,
        data.memberType === 'ORGANIZATION' ? data.ceoName : null,
        data.memberType === 'ORGANIZATION' ? data.taxEmail : null,
        plan.code,
        data.agreements.sms,
        data.agreements.marketing,
        newCustomerKey(),
      ],
    );

    issueSession(res, config, rows[0]);
    res.status(201).json({ user: await loadSerializedUser(db, rows[0].id) });
  });

  router.post('/login', limits.login, async (req, res) => {
    const { email, password, remember } = parse(loginSchema, req.body);
    const { rows } = await db.query(`SELECT * FROM users WHERE email = $1 AND status <> 'WITHDRAWN'`, [email]);
    const user = rows[0];
    const ok = user ? await verifyPassword(password, user.password_hash) : (await verifyPassword(password, await dummyHash()), false);

    if (user && user.password_set === false) {
      throw new HttpError(401, 'PASSWORD_NOT_SET', IMPORTED_MESSAGE);
    }
    if (!user || !ok) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', '아이디 또는 비밀번호가 올바르지 않습니다.');
    }
    if (user.status === 'SUSPENDED') throw forbidden('이용이 정지된 계정입니다. 사무국(02-2025-9171)으로 문의해 주세요.');

    await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
    issueSession(res, config, user, { remember });
    res.json({ user: await loadSerializedUser(db, user.id) });
  });

  router.post('/logout', (req, res) => {
    clearSession(res, config);
    res.json({ ok: true });
  });

  router.get('/me', async (req, res) => {
    if (!req.user) return res.json({ user: null });
    return res.json({ user: await loadSerializedUser(db, req.user.id) });
  });

  // 비밀번호 찾기: 가입 여부와 관계없이 같은 응답 (계정 존재 여부 노출 방지)
  router.post('/password/forgot', limits.passwordReset, async (req, res) => {
    const { email } = parse(z.object({ email: emailSchema }), req.body);
    const user = await findActiveUserByEmail(db, email);
    if (user) {
      const token = randomToken(32);
      await db.query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '30 minutes')`,
        [user.id, sha256(token)],
      );
      const link = `${config.appOrigin}/password-reset?token=${encodeURIComponent(token)}`;
      await mailer.send({ to: user.email, ...passwordResetEmail({ name: user.name, link }) });
    }
    res.json({ ok: true, message: '가입된 이메일이라면 비밀번호 재설정 안내 메일이 발송됩니다.' });
  });

  router.post('/password/reset', limits.passwordReset, async (req, res) => {
    const { token, password, agreements } = parse(resetSchema, req.body);
    const passwordHash = await hashPassword(password);
    await db.tx(async (client) => {
      const { rows } = await client.query(
        `SELECT * FROM password_resets
          WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE`,
        [sha256(token)],
      );
      if (!rows[0]) throw badRequest('링크가 만료되었거나 이미 사용되었습니다. 비밀번호 찾기를 다시 요청해 주세요.');

      // 회원명부로 옮긴 계정: 처음 비밀번호를 만들 때 이용약관 · 개인정보 동의가 필요
      const target = (await client.query('SELECT terms_agreed_at, privacy_agreed_at FROM users WHERE id = $1', [rows[0].user_id])).rows[0];
      const needsConsent = target && (!target.terms_agreed_at || !target.privacy_agreed_at);
      if (needsConsent && !(agreements?.terms && agreements?.privacy)) {
        throw new HttpError(400, 'CONSENT_REQUIRED', '처음 이용하시는 회원은 이용약관과 개인정보 수집·이용에 동의해 주세요.', {
          ...(agreements?.terms ? {} : { 'agreements.terms': '이용약관에 동의해 주세요.' }),
          ...(agreements?.privacy ? {} : { 'agreements.privacy': '개인정보 수집 및 이용에 동의해 주세요.' }),
        });
      }

      const updated = await client.query(
        `UPDATE users
            SET password_hash = $2, password_set = true, token_version = token_version + 1,
                terms_agreed_at = COALESCE(terms_agreed_at, CASE WHEN $3 THEN now() END),
                privacy_agreed_at = COALESCE(privacy_agreed_at, CASE WHEN $3 THEN now() END),
                updated_at = now()
          WHERE id = $1 AND status = 'ACTIVE'`,
        [rows[0].user_id, passwordHash, Boolean(needsConsent)],
      );
      if (!updated.rowCount) throw badRequest('사용할 수 없는 계정입니다.');
      await client.query('UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [rows[0].user_id]);
    });
    clearSession(res, config);
    res.json({ ok: true });
  });

  return router;
}
