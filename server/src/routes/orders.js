// src/routes/orders.js  →  /api/orders  (로그인 필요)
import { Router } from 'express';
import { z } from 'zod';
import { HttpError, badRequest, notFound } from '../lib/errors.js';
import { bizNoSchema, parse, text } from '../lib/validation.js';
import { requireAuth } from '../middleware/auth.js';
import { getPlan } from '../services/plans.js';
import { adminNewDepositEmail, bankTransferEmail, paymentCompletedEmail } from '../services/emails.js';
import { cancelOrderByUser, createOrder, getOrderByNo, serializeOrder } from '../services/orders.js';

const digits = (v) => String(v ?? '').replace(/\D/g, '');

const createOrderSchema = z
  .object({
    planCode: z.string().min(1, '회원 유형을 선택해 주세요.'),
    method: z.enum(['TOSS', 'BANK_TRANSFER', 'TEST'], { error: '결제 수단을 선택해 주세요.' }),
    depositorName: text(40, '입금자명'),
    receiptType: z.enum(['NONE', 'CASH_RECEIPT', 'TAX_INVOICE']).optional().default('NONE'),
    receiptInfo: z
      .object({
        purpose: z.enum(['INCOME_DEDUCTION', 'EXPENSE_PROOF']).optional(), // 현금영수증: 소득공제 / 지출증빙
        identifier: z.string().trim().max(20).optional(), // 휴대폰번호 또는 사업자번호
        businessNo: z.string().trim().max(20).optional(), // 세금계산서
        email: z.string().trim().max(120).optional(),
      })
      .optional()
      .nullable(),
    designatedPurpose: text(200, '사용용도'),
    company: z
      .object({
        companyName: text(80, '기업명'),
        businessNo: z.string().optional().nullable(),
        ceoName: text(40, '대표자명'),
        taxEmail: z.string().trim().toLowerCase().max(120).optional().nullable(),
      })
      .optional()
      .nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.method === 'BANK_TRANSFER' && d.receiptType === 'CASH_RECEIPT') {
      const id = digits(d.receiptInfo?.identifier);
      if (id.length < 10 || id.length > 11) {
        ctx.addIssue({ code: 'custom', path: ['receiptInfo.identifier'], message: '현금영수증 발급번호(휴대폰 또는 사업자번호)를 입력해 주세요.' });
      }
    }
    if (d.method === 'BANK_TRANSFER' && d.receiptType === 'TAX_INVOICE') {
      if (digits(d.receiptInfo?.businessNo).length !== 10) {
        ctx.addIssue({ code: 'custom', path: ['receiptInfo.businessNo'], message: '세금계산서용 사업자등록번호 10자리를 입력해 주세요.' });
      }
      if (!z.email().safeParse(d.receiptInfo?.email ?? '').success) {
        ctx.addIssue({ code: 'custom', path: ['receiptInfo.email'], message: '세금계산서 수신 이메일을 입력해 주세요.' });
      }
    }
    if (d.company?.businessNo && !bizNoSchema.safeParse(d.company.businessNo).success) {
      ctx.addIssue({ code: 'custom', path: ['company.businessNo'], message: '사업자등록번호 10자리를 입력해 주세요.' });
    }
    if (d.company?.taxEmail && !z.email().safeParse(d.company.taxEmail).success) {
      ctx.addIssue({ code: 'custom', path: ['company.taxEmail'], message: '이메일 형식이 올바르지 않습니다.' });
    }
  });

export default function orderRoutes({ db, config, toss, mailer }) {
  const router = Router();
  router.use(requireAuth);

  router.post('/', async (req, res) => {
    const input = parse(createOrderSchema, req.body);
    if (input.company?.businessNo) input.company.businessNo = bizNoSchema.parse(input.company.businessNo);
    if (input.method === 'BANK_TRANSFER') input.receiptInfo = input.receiptType === 'NONE' ? null : input.receiptInfo;
    else input.receiptType = 'NONE'; // 카드 · 간편결제 영수증은 토스페이먼츠가 발급

    if (input.method === 'TOSS' && (!config.toss.clientKey || !toss.isConfigured)) {
      throw new HttpError(503, 'TOSS_NOT_CONFIGURED', '카드·간편결제는 준비 중입니다. 무통장입금을 이용해 주세요.');
    }
    if (input.method === 'TEST' && !config.testPayment.enabled) {
      throw new HttpError(403, 'TEST_PAYMENT_DISABLED', '테스트 결제가 꺼져 있습니다. 카드·간편결제 또는 무통장입금을 이용해 주세요.');
    }

    const plan = await getPlan(db, input.planCode);
    const { order, user, paid } = await createOrder(db, { userId: req.user.id, plan, input, bank: config.bank });

    // 0원 테스트 결제: 주문과 동시에 결제완료 · 회원 자격 반영
    if (order.method === 'TEST') {
      await mailer.send({
        to: user.email,
        ...paymentCompletedEmail({ name: user.name, order, planName: plan.name, expiresAt: paid?.expiresAt ?? null }),
      });
      return res.status(201).json({ order: serializeOrder(order) });
    }

    if (order.method === 'BANK_TRANSFER') {
      await mailer.send({ to: user.email, ...bankTransferEmail({ name: user.name, order, bank: config.bank }) });
      if (mailer.adminNotify) {
        await mailer.send({ to: mailer.adminNotify, ...adminNewDepositEmail({ order, user, appOrigin: config.appOrigin }) });
      }
      return res.status(201).json({ order: serializeOrder(order, { bank: config.bank }) });
    }

    // 카드 · 간편결제: 화면에서 토스 결제위젯 requestPayment() 에 그대로 넘길 값
    return res.status(201).json({
      order: serializeOrder(order),
      toss: {
        clientKey: config.toss.clientKey,
        customerKey: user.customer_key,
        orderId: order.order_no,
        orderName: order.order_name,
        amount: order.amount,
        customerEmail: user.email,
        customerName: user.company_name || user.name,
        customerMobilePhone: digits(user.phone) || undefined,
      },
    });
  });

  router.get('/', async (req, res) => {
    const { rows } = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [req.user.id],
    );
    res.json({ orders: rows.map((o) => serializeOrder(o, { bank: config.bank })) });
  });

  router.get('/:orderNo', async (req, res) => {
    const order = await getOrderByNo(db, req.params.orderNo);
    if (!order || (order.user_id !== req.user.id && req.user.role !== 'ADMIN')) throw notFound('주문을 찾을 수 없습니다.');
    res.json({ order: serializeOrder(order, { bank: config.bank }) });
  });

  router.post('/:orderNo/cancel', async (req, res) => {
    if (!req.params.orderNo) throw badRequest('주문번호가 필요합니다.');
    const order = await cancelOrderByUser(db, { userId: req.user.id, orderNo: req.params.orderNo });
    res.json({ order: serializeOrder(order, { bank: config.bank }) });
  });

  return router;
}
