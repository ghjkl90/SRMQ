// src/routes/me.js  →  /api/me  (로그인 필요)
import { Router } from 'express';
import { z } from 'zod';
import { HttpError, badRequest, forbidden } from '../lib/errors.js';
import { hashPassword, sha256, verifyPassword } from '../lib/security.js';
import {
  bizNoSchema,
  mobileSchema,
  nameSchema,
  optionalPhoneSchema,
  parse,
  passwordSchema,
  text,
} from '../lib/validation.js';
import { clearSession, issueSession, requireAuth } from '../middleware/auth.js';
import { loadSerializedUser } from '../services/users.js';

const profileSchema = z
  .object({
    name: nameSchema.optional(),
    phone: mobileSchema.optional(),
    officePhone: optionalPhoneSchema,
    affiliation: text(80, '소속 기관/기업명'),
    department: text(60, '부서'),
    position: text(60, '직위'),
    companyName: text(80, '기업명'),
    businessNo: z.string().optional().nullable(),
    ceoName: text(40, '대표자명'),
    taxEmail: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .nullable()
      .refine((v) => !v || z.email().safeParse(v).success, { message: '이메일 형식이 올바르지 않습니다.' })
      .transform((v) => (v ? v : null)),
    smsOptIn: z.boolean().optional(),
    marketingOptIn: z.boolean().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.businessNo) {
      const r = bizNoSchema.safeParse(d.businessNo);
      if (!r.success) ctx.addIssue({ code: 'custom', path: ['businessNo'], message: r.error.issues[0].message });
    }
  });

const COLUMN = {
  name: 'name',
  phone: 'phone',
  officePhone: 'office_phone',
  affiliation: 'affiliation',
  department: 'department',
  position: 'position',
  companyName: 'company_name',
  businessNo: 'business_no',
  ceoName: 'ceo_name',
  taxEmail: 'tax_email',
  smsOptIn: 'sms_opt_in',
  marketingOptIn: 'marketing_opt_in',
};

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요.'),
    newPassword: passwordSchema,
    newPasswordConfirm: z.string(),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    path: ['newPasswordConfirm'],
    message: '새 비밀번호가 일치하지 않습니다.',
  });

export const WITHDRAW_REASONS = {
  LOW_USAGE: '서비스 이용 빈도 낮음 (이용할 기회가 적음)',
  LACK_OF_INFO: '원하는 교육/정책 정보 부족',
  PRIVACY_CONCERN: '개인정보 보호 및 계정 보안 우려',
  OTHER: '기타 사유',
};

const withdrawSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
  reason: z.enum(Object.keys(WITHDRAW_REASONS), { error: '탈퇴 사유를 선택해 주세요.' }),
  feedback: z.string().trim().max(500, '의견은 500자 이내로 입력해 주세요.').optional().nullable(),
  agreed: z.literal(true, { error: '탈퇴 전 유의사항에 동의해 주세요.' }),
});

export default function meRoutes({ db, config, limits }) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req, res) => {
    res.json({ user: await loadSerializedUser(db, req.user.id) });
  });

  // 회원정보 수정 (아이디 · 회원등급은 여기서 바꿀 수 없습니다)
  router.patch('/', async (req, res) => {
    const data = parse(profileSchema, req.body);
    if (data.businessNo) data.businessNo = bizNoSchema.parse(data.businessNo);

    const sets = [];
    const values = [req.user.id];
    for (const [key, column] of Object.entries(COLUMN)) {
      if (req.body[key] === undefined) continue;
      values.push(data[key] ?? null);
      sets.push(`${column} = $${values.length}`);
    }
    if (req.user.member_type === 'ORGANIZATION' && req.body.companyName !== undefined && !data.companyName) {
      throw badRequest('기업회원은 기업명을 비울 수 없습니다.', { companyName: '기업명을 입력해 주세요.' });
    }
    if (req.user.member_type === 'INDIVIDUAL' && req.body.affiliation !== undefined && !data.affiliation) {
      throw badRequest("소속 기관/기업명을 입력해 주세요. (무소속이면 '개인')", { affiliation: '소속을 입력해 주세요.' });
    }
    if (sets.length) {
      await db.query(`UPDATE users SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`, values);
    }
    res.json({ user: await loadSerializedUser(db, req.user.id) });
  });

  router.post('/password', limits.sensitive, async (req, res) => {
    const { currentPassword, newPassword } = parse(passwordChangeSchema, req.body);
    if (!(await verifyPassword(currentPassword, req.user.password_hash))) {
      throw new HttpError(400, 'WRONG_PASSWORD', '현재 비밀번호가 올바르지 않습니다.', {
        currentPassword: '현재 비밀번호가 올바르지 않습니다.',
      });
    }
    const { rows } = await db.query(
      `UPDATE users SET password_hash = $2, token_version = token_version + 1, updated_at = now()
        WHERE id = $1 RETURNING *`,
      [req.user.id, await hashPassword(newPassword)],
    );
    // 다른 기기의 로그인은 끊고, 지금 기기는 새 세션으로 유지
    issueSession(res, config, rows[0]);
    res.json({ ok: true });
  });

  // 회원탈퇴: 개인정보는 즉시 지우고, 결제 기록은 법정 보존기간 동안 주문 테이블에 남깁니다.
  router.post('/withdraw', limits.sensitive, async (req, res) => {
    const data = parse(withdrawSchema, req.body);
    if (req.user.role === 'ADMIN') throw forbidden('관리자 계정은 탈퇴할 수 없습니다. 다른 관리자에게 권한 해제를 요청하세요.');
    if (!(await verifyPassword(data.password, req.user.password_hash))) {
      throw new HttpError(400, 'WRONG_PASSWORD', '비밀번호가 올바르지 않습니다.', { password: '비밀번호가 올바르지 않습니다.' });
    }

    await db.tx(async (client) => {
      const user = req.user;
      await client.query(
        `INSERT INTO withdrawals (user_id, email_hash, reason, feedback, plan_code) VALUES ($1, $2, $3, $4, $5)`,
        [user.id, sha256(user.email), data.reason, data.feedback || null, user.plan_code],
      );
      await client.query(
        `UPDATE orders SET status = 'CANCELED', canceled_at = now(), updated_at = now()
          WHERE user_id = $1 AND (status = 'READY' OR (method = 'BANK_TRANSFER' AND status = 'WAITING_FOR_DEPOSIT'))`,
        [user.id],
      );
      await client.query(
        `UPDATE users
            SET status = 'WITHDRAWN', email = $2, password_hash = '!', name = '탈퇴회원', phone = '',
                office_phone = NULL, affiliation = NULL, department = NULL, position = NULL,
                company_name = NULL, business_no = NULL, ceo_name = NULL, tax_email = NULL,
                sms_opt_in = false, marketing_opt_in = false, membership_status = 'NONE',
                token_version = token_version + 1, withdrawn_at = now(), updated_at = now()
          WHERE id = $1`,
        [user.id, `withdrawn-${user.id}-${Date.now()}@withdrawn.invalid`],
      );
    });

    clearSession(res, config);
    res.json({ ok: true });
  });

  return router;
}
