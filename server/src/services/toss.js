// src/services/toss.js
// 토스페이먼츠 코어 API (결제 승인 · 조회 · 취소)
// 인증: 시크릿 키 뒤에 ':' 를 붙여 Base64 인코딩한 값을 Basic 인증 헤더로 보냅니다.

export class TossError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function createTossClient({ secretKey, apiBase, fetchImpl = globalThis.fetch }) {
  const authorization = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

  async function call(method, path, body, idempotencyKey) {
    if (!secretKey) throw new TossError(500, 'TOSS_NOT_CONFIGURED', '결제 모듈(TOSS_SECRET_KEY)이 설정되지 않았습니다.');
    const response = await fetchImpl(`${apiBase}${path}`, {
      method,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new TossError(response.status, data.code || 'TOSS_ERROR', data.message || '결제사 응답 오류');
    }
    return data;
  }

  return {
    isConfigured: Boolean(secretKey),
    confirm: ({ paymentKey, orderId, amount }) =>
      call('POST', '/v1/payments/confirm', { paymentKey, orderId, amount }, `confirm-${orderId}`),
    getPayment: (paymentKey) => call('GET', `/v1/payments/${encodeURIComponent(paymentKey)}`),
    getPaymentByOrderId: (orderId) => call('GET', `/v1/payments/orders/${encodeURIComponent(orderId)}`),
    cancel: (paymentKey, cancelReason) =>
      call('POST', `/v1/payments/${encodeURIComponent(paymentKey)}/cancel`, { cancelReason }, `cancel-${paymentKey}`),
  };
}

/** 토스 결제 상태 → 우리 주문 상태 */
export function mapTossStatus(status) {
  switch (status) {
    case 'DONE':
      return 'PAID';
    case 'WAITING_FOR_DEPOSIT':
      return 'WAITING_FOR_DEPOSIT';
    case 'CANCELED':
    case 'PARTIAL_CANCELED':
      return 'CANCELED';
    case 'ABORTED':
      return 'FAILED';
    case 'EXPIRED':
      return 'EXPIRED';
    default:
      return null; // READY · IN_PROGRESS 는 상태를 바꾸지 않음
  }
}

/** 결제수단 표시용 문구: 카드 / 가상계좌 / 간편결제(카카오페이) ... */
export function paymentMethodLabel(payment) {
  if (!payment) return null;
  if (payment.method === '간편결제' && payment.easyPay?.provider) return `간편결제(${payment.easyPay.provider})`;
  return payment.method || null;
}

// 금융결제원 은행 코드 (가상계좌 안내 표시용, 주요 은행만)
const BANKS = {
  '02': 'KDB산업은행', '03': 'IBK기업은행', '04': 'KB국민은행', '06': 'KB국민은행', '07': 'Sh수협은행',
  '11': 'NH농협은행', '12': '단위농협', '20': '우리은행', '23': 'SC제일은행', '27': '한국씨티은행',
  '31': 'iM뱅크(대구)', '32': '부산은행', '34': '광주은행', '35': '제주은행', '37': '전북은행',
  '39': '경남은행', '45': '새마을금고', '48': '신협', '64': '산림조합', '71': '우체국',
  '81': '하나은행', '88': '신한은행', '89': '케이뱅크', '90': '카카오뱅크', '92': '토스뱅크',
};

export function summarizeVirtualAccount(va) {
  if (!va) return null;
  return {
    bankCode: va.bankCode ?? null,
    bankName: BANKS[va.bankCode] || (va.bankCode ? `은행코드 ${va.bankCode}` : null),
    accountNumber: va.accountNumber ?? null,
    customerName: va.customerName ?? null,
    dueDate: va.dueDate ?? null,
  };
}
