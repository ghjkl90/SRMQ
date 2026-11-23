// src/services/membership.js
// 회비 계산 규칙과 회원 자격 반영/되돌리기. 회비 정책이 바뀌면 이 파일만 수정하면 됩니다.
import { conflict } from '../lib/errors.js';
import { addDays, addYears, formatKstDate } from '../lib/dates.js';

/** 갱신(기간 연장)은 만료 90일 전부터 가능 (중복 결제 방지) */
export const RENEWAL_WINDOW_DAYS = 90;

/**
 * 1회 결제로 받는 이용 기간(년): 연회비 등급 1년, 준회원 · 종신회원 10년.
 * 기한 없는 예전 등급(PERMANENT · LIFETIME)은 null — 토스페이먼츠 정책상 새로 팔지 않습니다.
 */
export const termYears = (plan) => ({ ANNUAL: 1, TEN_YEARS: 10 })[plan?.term] ?? null;

/** 같은 등급으로 기간을 연장할 때 내는 금액: 연회비 등급은 연회비, 10년 등급은 처음과 같은 회비 */
const renewalFee = (plan) => (plan.term === 'ANNUAL' ? plan.annual_fee : plan.term === 'TEN_YEARS' ? plan.join_fee : 0);

/** DB 값 + 만료일로 실제 상태를 계산합니다: NONE | ACTIVE | EXPIRED */
export function effectiveMembershipStatus(user, now = new Date()) {
  if (!user || user.membership_status !== 'ACTIVE') return 'NONE';
  if (user.membership_expires_at && new Date(user.membership_expires_at) < now) return 'EXPIRED';
  return 'ACTIVE';
}

/**
 * 결제 금액(견적)을 계산합니다. 금액은 항상 서버에서 계산하며, 화면에서 보낸 금액은 믿지 않습니다.
 *
 * 규칙
 *  - 신규 가입(NEW) · 등급 변경(CHANGE): 새 등급의 입회비 + 연회비(1년)
 *  - 같은 등급 갱신(RENEWAL): 만료 90일 전부터. 연회비 등급은 연회비(1년), 준회원 · 종신회원은 같은 회비(10년)
 *  - 기한 없이 가진 자격(예전 가입 · 명부 이관)은 다시 낼 금액이 없습니다.
 */
export function buildQuote(user, plan, now = new Date()) {
  const status = effectiveMembershipStatus(user, now);
  const hasMembership = status === 'ACTIVE' || status === 'EXPIRED';
  const samePlan = hasMembership && user.plan_code === plan.code;

  let orderType = hasMembership ? 'CHANGE' : 'NEW';
  if (samePlan) {
    const noExpiry = plan.term !== 'ANNUAL' && status === 'ACTIVE' && !user.membership_expires_at;
    if (!termYears(plan) || renewalFee(plan) <= 0 || noExpiry) {
      throw conflict('ALREADY_MEMBER', `이미 ${plan.name} 자격을 보유하고 있어 결제할 금액이 없습니다.`);
    }
    if (status === 'ACTIVE' && user.membership_expires_at) {
      const opensAt = addDays(user.membership_expires_at, -RENEWAL_WINDOW_DAYS);
      if (now < opensAt) {
        throw conflict(
          'RENEWAL_NOT_OPEN',
          `연회비 갱신은 만료 ${RENEWAL_WINDOW_DAYS}일 전(${formatKstDate(opensAt)})부터 가능합니다.`,
        );
      }
    }
    orderType = 'RENEWAL';
  }

  const items = [];
  if (orderType === 'RENEWAL' && plan.term === 'TEN_YEARS') {
    items.push({ type: 'JOIN_FEE', label: '회비 (10년 연장)', amount: plan.join_fee });
  } else if (orderType !== 'RENEWAL' && plan.join_fee > 0) {
    items.push({ type: 'JOIN_FEE', label: plan.term === 'TEN_YEARS' ? '입회비 (10년)' : '입회비', amount: plan.join_fee });
  }
  if (plan.annual_fee > 0) {
    items.push({
      type: 'ANNUAL_FEE',
      label: orderType === 'RENEWAL' ? '연회비 (1년 갱신)' : '연회비 (1년)',
      amount: plan.annual_fee,
    });
  }

  const amount = items.reduce((sum, item) => sum + item.amount, 0);
  if (amount <= 0) throw conflict('NOTHING_TO_PAY', '결제할 금액이 없습니다.');

  const suffix = { NEW: '가입', CHANGE: '등급 변경', RENEWAL: plan.term === 'ANNUAL' ? '연회비 갱신' : '기간 연장' }[orderType];
  return {
    orderType,
    items,
    amount,
    orderName: `사경원 ${plan.name} ${suffix}`,
    currentStatus: status,
  };
}

/** 결제 완료 시 회원 자격을 반영합니다. (트랜잭션 안에서 호출) */
export async function activateMembership(client, order, plan, now = new Date()) {
  const { rows } = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [order.user_id]);
  const user = rows[0];

  const snapshot = {
    plan_code: user.plan_code,
    membership_status: user.membership_status,
    membership_started_at: user.membership_started_at,
    membership_expires_at: user.membership_expires_at,
    membership_order_id: user.membership_order_id,
  };

  let startedAt = now;
  let expiresAt = null;
  const years = termYears(plan);
  if (years) {
    const current = user.membership_expires_at ? new Date(user.membership_expires_at) : null;
    const extendFromCurrent = order.order_type === 'RENEWAL' && current && current > now;
    expiresAt = addYears(extendFromCurrent ? current : now, years);
    if (order.order_type === 'RENEWAL' && user.membership_started_at) startedAt = user.membership_started_at;
  }

  await client.query(
    `UPDATE users
        SET plan_code = $2, membership_status = 'ACTIVE', membership_started_at = $3,
            membership_expires_at = $4, membership_order_id = $5, updated_at = now()
      WHERE id = $1`,
    [user.id, plan.code, startedAt, expiresAt, order.id],
  );
  await client.query('UPDATE orders SET prev_membership = $2 WHERE id = $1', [order.id, snapshot]);
  return { startedAt, expiresAt };
}

/** 결제 취소 시, 그 결제로 만들어진 자격이면 결제 전 상태로 되돌립니다. */
export async function revertMembershipIfFromOrder(client, order) {
  const { rows } = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [order.user_id]);
  const user = rows[0];
  if (!user || user.membership_order_id !== order.id) return false;

  const prev = order.prev_membership || {};
  await client.query(
    `UPDATE users
        SET plan_code = COALESCE($2, plan_code), membership_status = $3, membership_started_at = $4,
            membership_expires_at = $5, membership_order_id = $6, updated_at = now()
      WHERE id = $1`,
    [
      user.id,
      prev.plan_code ?? null,
      prev.membership_status || 'NONE',
      prev.membership_started_at ?? null,
      prev.membership_expires_at ?? null,
      prev.membership_order_id ?? null,
    ],
  );
  return true;
}
