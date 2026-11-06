// src/services/orders.js
// 주문 생성 → (토스 승인 | 무통장 입금확인) → 결제완료 시 회원 자격 반영
import { badRequest, conflict, HttpError, notFound } from '../lib/errors.js';
import { addDays } from '../lib/dates.js';
import { newOrderNo } from '../lib/security.js';
import { activateMembership, buildQuote, revertMembershipIfFromOrder } from './membership.js';
import { mapTossStatus, paymentMethodLabel, summarizeVirtualAccount, TossError } from './toss.js';

export function serializeOrder(order, { bank, admin = false, user = null } = {}) {
  if (!order) return null;
  return {
    orderNo: order.order_no,
    planCode: order.plan_code,
    orderType: order.order_type,
    orderName: order.order_name,
    items: order.items,
    amount: order.amount,
    method: order.method,
    status: order.status,
    payMethodLabel: order.pay_method_label,
    virtualAccount: order.virtual_account,
    receiptUrl: order.receipt_url,
    depositorName: order.depositor_name,
    depositDueAt: order.deposit_due_at,
    receiptType: order.receipt_type,
    receiptInfo: order.receipt_info,
    designatedPurpose: order.designated_purpose,
    failureCode: order.failure_code,
    failureMessage: order.failure_message,
    paidAt: order.paid_at,
    canceledAt: order.canceled_at,
    createdAt: order.created_at,
    bankAccount:
      order.method === 'BANK_TRANSFER' && bank
        ? { bankName: bank.name, accountNumber: bank.accountNumber, holder: bank.holder }
        : undefined,
    ...(admin
      ? {
          adminMemo: order.admin_memo,
          user: user ?? {
            id: order.user_id,
            name: order.user_name,
            email: order.user_email,
            phone: order.user_phone,
            companyName: order.user_company_name,
          },
        }
      : {}),
  };
}

export async function logPaymentEvent(q, orderNo, source, eventType, payload = null) {
  await q.query(
    'INSERT INTO payment_events (order_no, source, event_type, payload) VALUES ($1, $2, $3, $4)',
    [orderNo, source, eventType, payload],
  );
}

export async function getOrderByNo(q, orderNo, { forUpdate = false } = {}) {
  const { rows } = await q.query(
    `SELECT * FROM orders WHERE order_no = $1 ${forUpdate ? 'FOR UPDATE' : ''}`,
    [orderNo],
  );
  return rows[0] ?? null;
}

/**
 * 주문 생성. 금액은 buildQuote() 로 서버에서 계산합니다.
 * input: { method, depositorName, receiptType, receiptInfo, designatedPurpose, company }
 */
export async function createOrder(db, { userId, plan, input, bank }) {
  return db.tx(async (client) => {
    const { rows } = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [userId]);
    let user = rows[0];

    const pending = await client.query(
      `SELECT order_no, method FROM orders
        WHERE user_id = $1 AND status IN ('WAITING_FOR_DEPOSIT', 'CONFIRMING')
        ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    if (pending.rows[0]) {
      throw conflict(
        'PENDING_ORDER_EXISTS',
        '입금 대기 중인 주문이 있습니다. 입금을 완료하거나 주문을 취소한 뒤 다시 시도해 주세요.',
        { orderNo: pending.rows[0].order_no },
      );
    }

    // 결제창에서 이탈한 이전 주문(READY)은 정리
    await client.query(
      `UPDATE orders SET status = 'EXPIRED', updated_at = now() WHERE user_id = $1 AND status = 'READY'`,
      [userId],
    );

    const isTest = input.method === 'TEST';

    // 기업·특별회원: 기업 정보가 필요하며, 입력값은 회원 정보에도 저장
    // (0원 테스트 결제는 사업자등록번호 없이도 진행할 수 있게 비워 둬도 됨)
    if (plan.member_type === 'ORGANIZATION') {
      const c = input.company || {};
      const companyName = c.companyName || user.company_name || (isTest ? user.affiliation || user.name : null);
      const businessNo = c.businessNo || user.business_no || null;
      if (!isTest && (!companyName || !businessNo)) {
        throw badRequest('기업·특별회원은 기업명과 사업자등록번호를 입력해야 합니다.', {
          ...(companyName ? {} : { 'company.companyName': '기업명을 입력해 주세요.' }),
          ...(businessNo ? {} : { 'company.businessNo': '사업자등록번호를 입력해 주세요.' }),
        });
      }
      const updated = await client.query(
        `UPDATE users
            SET member_type = 'ORGANIZATION', company_name = $2, business_no = $3,
                ceo_name = COALESCE($4, ceo_name), tax_email = COALESCE($5, tax_email), updated_at = now()
          WHERE id = $1 RETURNING *`,
        [userId, companyName, businessNo, c.ceoName ?? null, c.taxEmail ?? null],
      );
      user = updated.rows[0];
    }

    const quote = buildQuote(user, plan);
    const orderNo = newOrderNo();
    const isBank = input.method === 'BANK_TRANSFER';
    // 테스트 결제: 원래 금액은 그대로 보여 주고, 같은 금액을 '테스트 결제'로 빼서 0원
    const items = isTest
      ? [...quote.items, { type: 'TEST_DISCOUNT', label: '테스트 결제 (실제 청구 없음)', amount: -quote.amount }]
      : quote.items;
    const amount = isTest ? 0 : quote.amount;
    const depositorName = isBank
      ? (input.depositorName || user.company_name || user.name).slice(0, 40)
      : null;

    const inserted = await client.query(
      `INSERT INTO orders
         (order_no, user_id, plan_code, order_type, order_name, items, amount, method, status,
          pay_method_label, depositor_name, deposit_due_at, receipt_type, receipt_info, designated_purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        orderNo,
        userId,
        plan.code,
        quote.orderType,
        isTest ? `${quote.orderName} (테스트)` : quote.orderName,
        JSON.stringify(items),
        amount,
        input.method,
        isBank ? 'WAITING_FOR_DEPOSIT' : 'READY',
        isBank ? '무통장입금' : isTest ? '테스트 결제(0원)' : null,
        depositorName,
        isBank ? addDays(new Date(), bank.dueDays) : null,
        input.receiptType || 'NONE',
        input.receiptInfo ?? null,
        plan.code === 'SPECIAL' ? input.designatedPurpose || null : null,
      ],
    );

    await logPaymentEvent(client, orderNo, 'USER', 'ORDER_CREATED', {
      method: input.method,
      amount,
      orderType: quote.orderType,
    });

    if (isTest) {
      const paid = await markOrderPaidTx(client, inserted.rows[0], { source: 'TEST', memo: '0원 테스트 결제' });
      return { order: paid.order, user, paid };
    }
    return { order: inserted.rows[0], user };
  });
}

/** 결제완료 처리 + 회원 자격 반영 (트랜잭션 안에서 호출) */
async function markOrderPaidTx(client, order, { source, processedBy = null, paidAt = new Date(), fields = {}, memo = null }) {
  const planResult = await client.query('SELECT * FROM membership_plans WHERE code = $1', [order.plan_code]);
  const plan = planResult.rows[0];

  const { rows } = await client.query(
    `UPDATE orders
        SET status = 'PAID', paid_at = $2, processed_by = COALESCE($3, processed_by),
            payment_key = COALESCE($4, payment_key), pay_method_label = COALESCE($5, pay_method_label),
            receipt_url = COALESCE($6, receipt_url), virtual_account = COALESCE($7, virtual_account),
            toss_secret = COALESCE($8, toss_secret), admin_memo = COALESCE($9, admin_memo),
            failure_code = NULL, failure_message = NULL, updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [
      order.id,
      paidAt,
      processedBy,
      fields.paymentKey ?? null,
      fields.label ?? null,
      fields.receiptUrl ?? null,
      fields.virtualAccount ?? null,
      fields.secret ?? null,
      memo,
    ],
  );
  const paidOrder = rows[0];
  const { expiresAt } = await activateMembership(client, paidOrder, plan);
  await logPaymentEvent(client, order.order_no, source, 'PAID', { processedBy, amount: order.amount });
  return { order: paidOrder, plan, expiresAt, becamePaid: true };
}

const slimPayment = (p) => ({
  paymentKey: p.paymentKey,
  orderId: p.orderId,
  status: p.status,
  method: p.method,
  totalAmount: p.totalAmount,
  approvedAt: p.approvedAt,
  easyPay: p.easyPay?.provider,
  virtualAccount: p.virtualAccount ? summarizeVirtualAccount(p.virtualAccount) : undefined,
});

/**
 * 토스페이먼츠 Payment 객체를 주문에 반영합니다. (승인 응답 · 웹훅 · 조회 결과 공통)
 * 여러 번 호출돼도 결과가 같도록(멱등) 작성했습니다.
 */
export async function applyTossPayment(db, orderNo, payment, source) {
  return db.tx(async (client) => {
    const order = await getOrderByNo(client, orderNo, { forUpdate: true });
    if (!order) return { order: null };

    await logPaymentEvent(client, orderNo, source, `TOSS_${payment.status}`, slimPayment(payment));

    if (payment.orderId !== order.order_no || Number(payment.totalAmount) !== order.amount) {
      const { rows } = await client.query(
        `UPDATE orders SET failure_code = 'MISMATCH', failure_message = $2, updated_at = now()
          WHERE id = $1 RETURNING *`,
        [order.id, `결제 정보 불일치 (결제금액 ${payment.totalAmount}, 주문금액 ${order.amount})`],
      );
      return { order: rows[0], mismatch: true };
    }

    const next = mapTossStatus(payment.status);
    const fields = {
      paymentKey: payment.paymentKey ?? null,
      label: paymentMethodLabel(payment),
      receiptUrl: payment.receipt?.url ?? null,
      virtualAccount: summarizeVirtualAccount(payment.virtualAccount),
      secret: payment.secret ?? null,
    };

    if (next === 'PAID') {
      if (order.status === 'PAID') return { order };
      return markOrderPaidTx(client, order, {
        source,
        paidAt: payment.approvedAt ? new Date(payment.approvedAt) : new Date(),
        fields,
      });
    }

    if (next === 'WAITING_FOR_DEPOSIT') {
      // 입금 오류 등으로 DONE → WAITING_FOR_DEPOSIT 로 돌아온 경우 자격도 되돌립니다.
      if (order.status === 'PAID') await revertMembershipIfFromOrder(client, order);
      const dueDate = payment.virtualAccount?.dueDate ? new Date(payment.virtualAccount.dueDate) : null;
      const { rows } = await client.query(
        `UPDATE orders
            SET status = 'WAITING_FOR_DEPOSIT', payment_key = COALESCE($2, payment_key),
                pay_method_label = COALESCE($3, pay_method_label), virtual_account = COALESCE($4, virtual_account),
                toss_secret = COALESCE($5, toss_secret), deposit_due_at = COALESCE($6, deposit_due_at),
                paid_at = NULL, updated_at = now()
          WHERE id = $1 RETURNING *`,
        [order.id, fields.paymentKey, fields.label, fields.virtualAccount, fields.secret, dueDate],
      );
      return { order: rows[0] };
    }

    if (next === 'CANCELED') {
      if (order.status === 'CANCELED') return { order };
      if (order.status === 'PAID') await revertMembershipIfFromOrder(client, order);
      const { rows } = await client.query(
        `UPDATE orders SET status = 'CANCELED', canceled_at = now(), updated_at = now() WHERE id = $1 RETURNING *`,
        [order.id],
      );
      return { order: rows[0] };
    }

    if ((next === 'FAILED' || next === 'EXPIRED') && !['PAID', 'CANCELED'].includes(order.status)) {
      const { rows } = await client.query(
        `UPDATE orders SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
        [order.id, next],
      );
      return { order: rows[0] };
    }

    return { order };
  });
}

/** 토스 결제 승인 (successUrl 에서 호출) */
export async function confirmTossPayment(db, toss, { userId, paymentKey, orderId, amount }) {
  const order = await getOrderByNo(db, orderId);
  if (!order || order.user_id !== userId) throw notFound('주문을 찾을 수 없습니다.');
  if (order.method !== 'TOSS') throw badRequest('카드·간편결제 주문이 아닙니다.');

  // 새로고침 · 중복 호출: 이미 처리된 결과를 그대로 돌려줍니다.
  if (['PAID', 'WAITING_FOR_DEPOSIT'].includes(order.status) && order.payment_key === paymentKey) {
    return { order };
  }
  if (order.status !== 'READY' && order.status !== 'CONFIRMING') {
    throw conflict('INVALID_ORDER_STATUS', '이미 처리되었거나 만료된 주문입니다. 다시 결제해 주세요.');
  }
  if (Number(amount) !== order.amount) {
    await db.query(
      `UPDATE orders SET status = 'FAILED', failure_code = 'AMOUNT_MISMATCH', failure_message = $2, updated_at = now()
        WHERE id = $1 AND status = 'READY'`,
      [order.id, `요청 금액 ${amount} ≠ 주문 금액 ${order.amount}`],
    );
    await logPaymentEvent(db, orderId, 'USER', 'AMOUNT_MISMATCH', { amount, expected: order.amount });
    throw badRequest('결제 금액이 주문 금액과 다릅니다. 다시 결제해 주세요.');
  }

  // 동시에 두 번 호출돼도 한 번만 승인하도록 상태를 먼저 선점합니다.
  const claimed = await db.query(
    `UPDATE orders SET status = 'CONFIRMING', payment_key = $2, updated_at = now()
      WHERE id = $1 AND status = 'READY' RETURNING *`,
    [order.id, paymentKey],
  );
  if (!claimed.rowCount) {
    throw new HttpError(409, 'PAYMENT_PROCESSING', '결제를 확인하고 있습니다. 잠시 후 다시 확인해 주세요.');
  }

  try {
    const payment = await toss.confirm({ paymentKey, orderId, amount: order.amount });
    return await applyTossPayment(db, orderId, payment, 'TOSS_CONFIRM');
  } catch (err) {
    if (err instanceof TossError) {
      if (err.code === 'ALREADY_PROCESSED_PAYMENT') {
        const payment = await toss.getPayment(paymentKey);
        return applyTossPayment(db, orderId, payment, 'TOSS_CONFIRM');
      }
      await db.query(
        `UPDATE orders SET status = 'FAILED', failure_code = $2, failure_message = $3, updated_at = now()
          WHERE id = $1 AND status = 'CONFIRMING'`,
        [order.id, err.code, err.message],
      );
      await logPaymentEvent(db, orderId, 'TOSS_CONFIRM', 'CONFIRM_FAILED', { code: err.code, message: err.message });
      throw new HttpError(400, err.code, err.message);
    }
    // 통신 오류: 결과를 알 수 없으므로 READY 로 되돌리고, 재시도 · 웹훅 · 스케줄러가 정리합니다.
    await db.query(`UPDATE orders SET status = 'READY', updated_at = now() WHERE id = $1 AND status = 'CONFIRMING'`, [order.id]);
    await logPaymentEvent(db, orderId, 'TOSS_CONFIRM', 'CONFIRM_NETWORK_ERROR', { message: err.message });
    throw new HttpError(502, 'PAYMENT_GATEWAY_ERROR', '결제 승인 중 통신 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

/** 회원 본인 취소: 결제 전(READY) 주문과 무통장 입금 대기 주문만 */
export async function cancelOrderByUser(db, { userId, orderNo }) {
  return db.tx(async (client) => {
    const order = await getOrderByNo(client, orderNo, { forUpdate: true });
    if (!order || order.user_id !== userId) throw notFound('주문을 찾을 수 없습니다.');
    const cancellable =
      order.status === 'READY' || (order.method === 'BANK_TRANSFER' && order.status === 'WAITING_FOR_DEPOSIT');
    if (!cancellable) {
      throw conflict('NOT_CANCELLABLE', '이 주문은 직접 취소할 수 없습니다. 사무국(02-2025-9171)으로 문의해 주세요.');
    }
    const { rows } = await client.query(
      `UPDATE orders SET status = 'CANCELED', canceled_at = now(), updated_at = now() WHERE id = $1 RETURNING *`,
      [order.id],
    );
    await logPaymentEvent(client, orderNo, 'USER', 'CANCELED_BY_USER');
    return rows[0];
  });
}

/** 관리자: 무통장입금 확인 → 결제완료 + 자격 반영 */
export async function confirmBankDeposit(db, { orderNo, adminId, memo }) {
  return db.tx(async (client) => {
    const order = await getOrderByNo(client, orderNo, { forUpdate: true });
    if (!order) throw notFound('주문을 찾을 수 없습니다.');
    if (order.method !== 'BANK_TRANSFER') throw badRequest('무통장입금 주문이 아닙니다.');
    if (!['WAITING_FOR_DEPOSIT', 'EXPIRED'].includes(order.status)) {
      throw conflict('INVALID_ORDER_STATUS', '입금 대기(또는 기한 만료) 상태의 주문만 입금 확인할 수 있습니다.');
    }
    return markOrderPaidTx(client, order, { source: 'ADMIN', processedBy: adminId, memo: memo || null });
  });
}

/** 관리자: 주문 취소 (토스 결제 건은 토스 취소 API로 환불까지 진행) */
export async function cancelOrderByAdmin(db, toss, { orderNo, adminId, reason }) {
  const order = await getOrderByNo(db, orderNo);
  if (!order) throw notFound('주문을 찾을 수 없습니다.');
  if (['CANCELED', 'FAILED'].includes(order.status)) throw conflict('INVALID_ORDER_STATUS', '이미 취소되었거나 실패한 주문입니다.');

  if (order.method === 'TOSS' && order.payment_key && ['PAID', 'WAITING_FOR_DEPOSIT'].includes(order.status)) {
    try {
      await toss.cancel(order.payment_key, reason || '관리자 취소');
    } catch (err) {
      if (err instanceof TossError) throw new HttpError(400, err.code, `토스페이먼츠 취소 실패: ${err.message}`);
      throw err;
    }
  }

  return db.tx(async (client) => {
    const locked = await getOrderByNo(client, orderNo, { forUpdate: true });
    if (locked.status === 'PAID') await revertMembershipIfFromOrder(client, locked);
    const { rows } = await client.query(
      `UPDATE orders
          SET status = 'CANCELED', canceled_at = now(), processed_by = $2,
              admin_memo = CONCAT_WS(E'\n', admin_memo, $3::text), updated_at = now()
        WHERE id = $1 RETURNING *`,
      [locked.id, adminId, reason ? `[취소] ${reason}` : '[취소]'],
    );
    await logPaymentEvent(client, orderNo, 'ADMIN', 'CANCELED_BY_ADMIN', { adminId, reason });
    return rows[0];
  });
}

/** 스케줄러: 기한이 지난 무통장 주문 · 결제창 이탈 주문 만료 처리 */
export async function expireStaleOrders(db) {
  const bank = await db.query(
    `UPDATE orders SET status = 'EXPIRED', updated_at = now()
      WHERE method = 'BANK_TRANSFER' AND status = 'WAITING_FOR_DEPOSIT' AND deposit_due_at < now()
      RETURNING order_no`,
  );
  const ready = await db.query(
    `UPDATE orders SET status = 'EXPIRED', updated_at = now()
      WHERE status = 'READY' AND created_at < now() - interval '1 day'
      RETURNING order_no`,
  );
  return { bank: bank.rowCount, ready: ready.rowCount };
}

/** 스케줄러: 승인 도중 서버가 멈춰 CONFIRMING 에 남은 주문을 토스에 조회해 정리 */
export async function reconcileStuckOrders(db, toss) {
  if (!toss.isConfigured) return 0;
  const { rows } = await db.query(
    `SELECT order_no, id FROM orders WHERE status = 'CONFIRMING' AND updated_at < now() - interval '10 minutes'`,
  );
  for (const row of rows) {
    try {
      const payment = await toss.getPaymentByOrderId(row.order_no);
      await applyTossPayment(db, row.order_no, payment, 'SYSTEM');
    } catch (err) {
      if (err instanceof TossError && err.status === 404) {
        await db.query(`UPDATE orders SET status = 'EXPIRED', updated_at = now() WHERE id = $1 AND status = 'CONFIRMING'`, [row.id]);
      } else {
        console.error('[reconcile]', row.order_no, err.message);
      }
    }
  }
  return rows.length;
}
