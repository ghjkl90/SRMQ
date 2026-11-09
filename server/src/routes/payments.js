// src/routes/payments.js  →  /api/payments
import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../lib/validation.js';
import { safeEqual } from '../lib/security.js';
import { requireAuth } from '../middleware/auth.js';
import { paymentCompletedEmail } from '../services/emails.js';
import { applyTossPayment, confirmTossPayment, getOrderByNo, logPaymentEvent, serializeOrder } from '../services/orders.js';
import { findUserById } from '../services/users.js';
import { tossAvailableFor } from '../lib/tossAccess.js';

const confirmSchema = z.object({
  paymentKey: z.string().min(1).max(200),
  orderId: z.string().min(6).max(64),
  amount: z.coerce.number().int().positive(),
});

export default function paymentRoutes({ db, config, toss, mailer }) {
  const router = Router();

  async function notifyPaid(result) {
    if (!result?.becamePaid) return;
    const user = await findUserById(db, result.order.user_id);
    if (!user) return;
    await mailer.send({
      to: user.email,
      ...paymentCompletedEmail({ name: user.name, order: result.order, planName: result.plan.name, expiresAt: result.expiresAt }),
    });
  }

  // 결제 화면 설정값 (토스 클라이언트 키는 공개용 키라 내려보내도 됩니다)
  router.get('/config', (req, res) => {
    const tossEnabled = tossAvailableFor(config, toss, req.user);
    res.json({
      tossEnabled,
      tossClientKey: tossEnabled ? config.toss.clientKey : null,
      tossMaxAmount: config.toss.maxAmount, // 이 금액 이상은 무통장입금만 (0 이면 제한 없음)
      testPayment: config.testPayment.enabled, // 0원 테스트 결제 (사업자등록 · PG 계약 전 시험용)
      bankTransfer: {
        bankName: config.bank.name,
        accountNumber: config.bank.accountNumber,
        holder: config.bank.holder,
        dueDays: config.bank.dueDays,
      },
    });
  });

  // 토스 결제 성공 페이지(successUrl)에서 호출 → 서버에서 금액 검증 후 승인
  router.post('/toss/confirm', requireAuth, async (req, res) => {
    const body = parse(confirmSchema, req.body);
    const result = await confirmTossPayment(db, toss, { userId: req.user.id, ...body });
    await notifyPaid(result);
    res.json({ order: serializeOrder(result.order) });
  });

  /**
   * 토스페이먼츠 웹훅 (개발자센터 > 웹훅에 https://도메인/api/payments/toss/webhook 등록)
   * - PAYMENT_STATUS_CHANGED : 결제 상태 변경 → 토스 API로 다시 조회해 반영 (위조 방지)
   * - DEPOSIT_CALLBACK       : 가상계좌 입금 → 승인 때 받은 secret 과 비교해 검증
   * 10초 안에 200 을 돌려주지 않으면 토스가 최대 7회 재전송합니다.
   */
  router.post('/toss/webhook', async (req, res) => {
    const body = req.body || {};
    const orderNo = body.orderId || body.data?.orderId || null;
    await logPaymentEvent(db, orderNo, 'TOSS_WEBHOOK', body.eventType || 'DEPOSIT_CALLBACK', body);

    if (body.eventType === 'PAYMENT_STATUS_CHANGED' && body.data?.paymentKey) {
      const payment = toss.isConfigured ? await toss.getPayment(body.data.paymentKey) : null;
      if (payment) {
        const order = await getOrderByNo(db, payment.orderId);
        if (order) await notifyPaid(await applyTossPayment(db, order.order_no, payment, 'TOSS_WEBHOOK'));
      }
      return res.status(200).json({ ok: true });
    }

    if (!body.eventType && body.secret && orderNo) {
      const order = await getOrderByNo(db, orderNo);
      if (order?.toss_secret && safeEqual(order.toss_secret, body.secret)) {
        const payment = toss.isConfigured ? await toss.getPaymentByOrderId(orderNo) : null;
        if (payment) await notifyPaid(await applyTossPayment(db, orderNo, payment, 'TOSS_WEBHOOK'));
      } else {
        await logPaymentEvent(db, orderNo, 'TOSS_WEBHOOK', 'SECRET_MISMATCH');
      }
    }
    return res.status(200).json({ ok: true });
  });

  return router;
}
