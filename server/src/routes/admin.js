// src/routes/admin.js  →  /api/admin  (관리자 전용: app.js 에서 requireAdmin 적용)
import { Router } from 'express';
import { z } from 'zod';
import { badRequest, notFound } from '../lib/errors.js';
import { addYears, formatKstDate } from '../lib/dates.js';
import { idParam, parse } from '../lib/validation.js';
import { paymentCompletedEmail } from '../services/emails.js';
import { effectiveMembershipStatus } from '../services/membership.js';
import { cancelOrderByAdmin, confirmBankDeposit, logPaymentEvent, serializeOrder } from '../services/orders.js';
import { getPlan } from '../services/plans.js';
import { findUserById } from '../services/users.js';

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  q: z.string().trim().max(80).optional(),
});

const ORDER_STATUSES = ['READY', 'CONFIRMING', 'WAITING_FOR_DEPOSIT', 'PAID', 'CANCELED', 'FAILED', 'EXPIRED'];

function memberFilters({ q, planCode, status }) {
  const where = [`u.status <> 'WITHDRAWN'`];
  const params = [];
  if (q) {
    params.push(`%${q}%`);
    const i = params.length;
    where.push(`(u.email ILIKE $${i} OR u.name ILIKE $${i} OR u.company_name ILIKE $${i} OR u.affiliation ILIKE $${i} OR u.phone ILIKE $${i})`);
  }
  if (planCode) {
    params.push(planCode);
    where.push(`u.plan_code = $${params.length}`);
  }
  if (status === 'ACTIVE') where.push(`u.membership_status = 'ACTIVE' AND (u.membership_expires_at IS NULL OR u.membership_expires_at >= now())`);
  if (status === 'EXPIRED') where.push(`u.membership_status = 'ACTIVE' AND u.membership_expires_at < now()`);
  if (status === 'NONE') where.push(`u.membership_status = 'NONE'`);
  return { sql: where.join(' AND '), params };
}

const STATUS_LABEL = { ACTIVE: '정상', EXPIRED: '만료', NONE: '미납' };

const csvCell = (v) => {
  let s = v === null || v === undefined ? '' : String(v);
  // 엑셀 수식 주입 방지: = + - @ 로 시작하는 값은 문자로 취급되도록 ' 를 붙임 (회원이 입력한 이름 · 소속 등)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function adminRoutes({ db, config, toss, mailer }) {
  const router = Router();

  router.get('/summary', async (_req, res) => {
    const { rows } = await db.query(`
      SELECT
        (SELECT count(*) FROM users WHERE status = 'ACTIVE')::int AS members,
        (SELECT count(*) FROM users WHERE status = 'ACTIVE' AND membership_status = 'ACTIVE'
            AND (membership_expires_at IS NULL OR membership_expires_at >= now()))::int AS active_members,
        (SELECT count(*) FROM orders WHERE method = 'BANK_TRANSFER' AND status = 'WAITING_FOR_DEPOSIT')::int AS pending_deposits,
        (SELECT COALESCE(sum(amount), 0) FROM orders
          WHERE status = 'PAID' AND paid_at >= date_trunc('year', now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul')::bigint AS paid_this_year
    `);
    const byPlan = await db.query(`
      SELECT p.code, p.name, p.category,
             count(u.id) FILTER (WHERE u.membership_status = 'ACTIVE'
               AND (u.membership_expires_at IS NULL OR u.membership_expires_at >= now()))::int AS active
        FROM membership_plans p
        LEFT JOIN users u ON u.plan_code = p.code AND u.status = 'ACTIVE'
       GROUP BY p.code, p.name, p.category, p.sort_order
       ORDER BY p.sort_order`);
    const s = rows[0];
    res.json({
      members: s.members,
      activeMembers: s.active_members,
      pendingDeposits: s.pending_deposits,
      paidThisYear: Number(s.paid_this_year),
      byPlan: byPlan.rows,
    });
  });

  /* ------------------------------ 결제 · 입금 ------------------------------ */

  router.get('/orders', async (req, res) => {
    const { page, pageSize, q } = parse(pageSchema, req.query);
    const status = ORDER_STATUSES.includes(req.query.status) ? req.query.status : null;
    const method = ['TOSS', 'BANK_TRANSFER'].includes(req.query.method) ? req.query.method : null;

    const where = [];
    const params = [];
    if (status) {
      params.push(status);
      where.push(`o.status = $${params.length}`);
    }
    if (method) {
      params.push(method);
      where.push(`o.method = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      const i = params.length;
      where.push(`(o.order_no ILIKE $${i} OR u.name ILIKE $${i} OR u.email ILIKE $${i} OR o.depositor_name ILIKE $${i} OR u.company_name ILIKE $${i})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const total = await db.query(`SELECT count(*)::int AS n FROM orders o JOIN users u ON u.id = o.user_id ${whereSql}`, params);
    const { rows } = await db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.company_name AS user_company_name
         FROM orders o JOIN users u ON u.id = o.user_id
         ${whereSql}
        ORDER BY o.created_at DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    );
    res.json({
      orders: rows.map((o) => serializeOrder(o, { admin: true, bank: config.bank })),
      total: total.rows[0].n,
      page,
      pageSize,
    });
  });

  router.post('/orders/:orderNo/confirm-deposit', async (req, res) => {
    const { memo } = parse(z.object({ memo: z.string().trim().max(300).optional() }), req.body);
    const result = await confirmBankDeposit(db, { orderNo: req.params.orderNo, adminId: req.user.id, memo });
    const user = await findUserById(db, result.order.user_id);
    if (user?.status === 'ACTIVE') {
      await mailer.send({
        to: user.email,
        ...paymentCompletedEmail({ name: user.name, order: result.order, planName: result.plan.name, expiresAt: result.expiresAt }),
      });
    }
    res.json({ order: serializeOrder(result.order, { admin: true, bank: config.bank, user: user && { id: user.id, name: user.name, email: user.email } }) });
  });

  router.post('/orders/:orderNo/cancel', async (req, res) => {
    const { reason } = parse(z.object({ reason: z.string().trim().max(200).optional() }), req.body);
    const order = await cancelOrderByAdmin(db, toss, { orderNo: req.params.orderNo, adminId: req.user.id, reason });
    res.json({ order: serializeOrder(order, { admin: true, bank: config.bank, user: { id: order.user_id } }) });
  });

  /* --------------------------------- 회원 --------------------------------- */

  router.get('/members', async (req, res) => {
    const { page, pageSize, q } = parse(pageSchema, req.query);
    const { sql, params } = memberFilters({ q, planCode: req.query.planCode || null, status: req.query.status || null });
    const total = await db.query(`SELECT count(*)::int AS n FROM users u WHERE ${sql}`, params);
    const { rows } = await db.query(
      `SELECT u.*, p.name AS plan_name, p.short_label AS plan_short_label, p.badge_tone AS plan_badge_tone
         FROM users u LEFT JOIN membership_plans p ON p.code = u.plan_code
        WHERE ${sql}
        ORDER BY u.created_at DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    );
    res.json({
      members: rows.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        memberType: u.member_type,
        organization: u.company_name || u.affiliation,
        planCode: u.plan_code,
        planName: u.plan_name,
        planBadgeTone: u.plan_badge_tone,
        membershipStatus: effectiveMembershipStatus(u),
        startedAt: u.membership_started_at,
        expiresAt: u.membership_expires_at,
        createdAt: u.created_at,
        lastLoginAt: u.last_login_at,
        adminMemo: u.admin_memo,
        source: u.source, // SIGNUP | ADMIN | IMPORT(회원명부 이관)
        passwordSet: u.password_set,
      })),
      total: total.rows[0].n,
      page,
      pageSize,
    });
  });

  // 엑셀에서 바로 열리는 CSV (한글 깨짐 방지 BOM 포함)
  router.get('/members/export.csv', async (req, res) => {
    const { sql, params } = memberFilters({ q: req.query.q || null, planCode: req.query.planCode || null, status: req.query.status || null });
    const { rows } = await db.query(
      `SELECT u.*, p.name AS plan_name FROM users u LEFT JOIN membership_plans p ON p.code = u.plan_code
        WHERE ${sql} ORDER BY u.created_at DESC`,
      params,
    );
    const header = ['가입일', '아이디(이메일)', '성명/담당자', '휴대전화', '회원구분', '소속/기업명', '사업자등록번호', '회원등급', '자격상태', '자격시작', '자격만료', 'SMS수신', '뉴스레터수신', '등록경로', '비밀번호설정'];
    const lines = rows.map((u) =>
      [
        formatKstDate(u.created_at),
        u.email,
        u.name,
        u.phone,
        u.member_type === 'ORGANIZATION' ? '기업' : '개인',
        u.company_name || u.affiliation,
        u.business_no,
        u.plan_name,
        STATUS_LABEL[effectiveMembershipStatus(u)],
        formatKstDate(u.membership_started_at),
        u.membership_expires_at ? formatKstDate(u.membership_expires_at) : u.membership_status === 'ACTIVE' ? '기한없음' : '',
        u.sms_opt_in ? 'Y' : 'N',
        u.marketing_opt_in ? 'Y' : 'N',
        u.source === 'IMPORT' ? '회원명부 이관' : u.source === 'ADMIN' ? '관리자' : '홈페이지 가입',
        u.password_set ? 'Y' : 'N',
      ].map(csvCell).join(','),
    );
    const filename = encodeURIComponent(`사경원_회원명부_${formatKstDate(new Date()).replace(/\./g, '')}.csv`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.send(`﻿${[header.join(','), ...lines].join('\r\n')}`);
  });

  // 관리자 수동 처리: 기존 오프라인 회원 등록, 자격 연장 · 해제 등
  router.patch('/members/:id/membership', async (req, res) => {
    const id = parse(idParam, req.params.id);
    const data = parse(
      z.object({
        planCode: z.string().nullable().optional(),
        status: z.enum(['ACTIVE', 'NONE']),
        expiresAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, '만료일은 YYYY-MM-DD 형식입니다.')
          .nullable()
          .optional(),
        memo: z.string().trim().max(300).optional(),
      }),
      req.body,
    );
    const user = await findUserById(db, id);
    if (!user || user.status === 'WITHDRAWN') throw notFound('회원을 찾을 수 없습니다.');

    let planCode = data.planCode ?? user.plan_code;
    let expiresAt = null;
    if (data.status === 'ACTIVE') {
      if (!planCode) throw badRequest('회원등급을 선택해 주세요.', { planCode: '회원등급을 선택해 주세요.' });
      const plan = await getPlan(db, planCode, { activeOnly: false });
      planCode = plan.code;
      if (data.expiresAt) expiresAt = new Date(`${data.expiresAt}T23:59:59+09:00`);
      else if (plan.term === 'ANNUAL') expiresAt = addYears(new Date(), 1);
    }

    await db.query(
      `UPDATE users
          SET plan_code = $2, membership_status = $3,
              membership_started_at = CASE WHEN $3 = 'ACTIVE' THEN COALESCE(membership_started_at, now()) ELSE membership_started_at END,
              membership_expires_at = $4, membership_order_id = NULL,
              admin_memo = CASE WHEN $5::text IS NULL THEN admin_memo ELSE CONCAT_WS(E'\n', admin_memo, $5::text) END,
              updated_at = now()
        WHERE id = $1`,
      [id, planCode, data.status, expiresAt, data.memo ? `[${formatKstDate(new Date())}] ${data.memo}` : null],
    );
    await logPaymentEvent(db, null, 'ADMIN', 'MEMBERSHIP_MANUAL_UPDATE', {
      adminId: req.user.id,
      userId: id,
      planCode,
      status: data.status,
      expiresAt,
    });
    res.json({ ok: true });
  });

  return router;
}
