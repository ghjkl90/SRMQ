// src/components/member/membership.js
// 회원 · 결제 화면에서 함께 쓰는 표시용 문구와 형식 도우미

export const CATEGORY_LABEL = {
  GENERAL: '일반회원',
  CORPORATE: '기업회원',
  SPECIAL: '특별회원',
};

export const TERM_LABEL = {
  ANNUAL: '1년 (매년 연회비)',
  TEN_YEARS: '10년 (1회 결제)',
  PERMANENT: '기한 없음 (입회비 1회)',
  LIFETIME: '평생 (종신)',
};

export const MEMBERSHIP_STATUS = {
  ACTIVE: { label: '정상', tone: 'green' },
  EXPIRED: { label: '만료', tone: 'amber' },
  NONE: { label: '회비 미납', tone: 'slate' },
};

export const ORDER_STATUS = {
  READY: { label: '결제대기', tone: 'sky' },
  CONFIRMING: { label: '승인중', tone: 'sky' },
  WAITING_FOR_DEPOSIT: { label: '입금대기', tone: 'amber' },
  PAID: { label: '결제완료', tone: 'green' },
  CANCELED: { label: '취소', tone: 'slate' },
  FAILED: { label: '실패', tone: 'red' },
  EXPIRED: { label: '기한만료', tone: 'slate' },
};

export const ORDER_TYPE_LABEL = { NEW: '신규 가입', CHANGE: '등급 변경', RENEWAL: '기간 연장' };

export const METHOD_LABEL = { TOSS: '카드·간편결제', BANK_TRANSFER: '무통장입금', TEST: '테스트 결제(0원)' };

export const RECEIPT_TYPE_LABEL = {
  NONE: '발급 안 함',
  CASH_RECEIPT: '현금영수증',
  TAX_INVOICE: '세금계산서(계산서)',
};

export const WITHDRAW_REASONS = [
  { value: 'LOW_USAGE', label: '서비스 이용 빈도 낮음 (이용할 기회가 적음)' },
  { value: 'LACK_OF_INFO', label: '원하는 교육/정책 정보 부족' },
  { value: 'PRIVACY_CONCERN', label: '개인정보 보호 및 계정 보안 우려' },
  { value: 'OTHER', label: '기타 사유' },
];

export const formatWon = (amount) => `${Number(amount || 0).toLocaleString('ko-KR')}원`;

/** 1회 결제로 받는 이용 기간(사용 주기) — 회원 안내 · 결제 화면 · 결제경로 심사에 함께 씀 */
export function usagePeriodText(plan) {
  if (!plan) return '-';
  if (plan.term === 'ANNUAL') return '결제일부터 1년';
  if (plan.term === 'TEN_YEARS') return '결제일부터 10년';
  if (plan.term === 'LIFETIME') return '평생 (연회비 없음)';
  return '기한 없음 (연회비 없음)';
}

/** 이용 기간이 끝난 뒤 — 자동결제(정기결제)는 하지 않습니다 */
export function renewalText(plan) {
  if (!plan) return '';
  if (plan.term === 'ANNUAL') return `만료 전 연회비 ${formatWon(plan.annualFee)}을 직접 결제하면 1년 연장 (자동결제 없음)`;
  if (plan.term === 'TEN_YEARS') return `만료 전 ${formatWon(plan.joinFee)}을 다시 결제하면 10년 연장 (자동결제 없음)`;
  return '추가 결제 없음';
}

/** 2026.11.02 */
export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return `${get('year')}.${get('month')}.${get('day')}`;
}

/** 2026.11.02 14:30 */
export function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  const time = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${formatDate(value)} ${time}`;
}

export const digitsOnly = (v) => String(v ?? '').replace(/\D/g, '');

/** 입력 중 자동 하이픈: 010-1234-5678 */
export function formatPhoneInput(value) {
  const d = digitsOnly(value).slice(0, 11);
  if (d.startsWith('02')) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** 입력 중 자동 하이픈: 123-45-67890 */
export function formatBizNoInput(value) {
  const d = digitsOnly(value).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

/** 회원가입 화면 안내와 같은 규칙: 영문 · 숫자 · 특수문자 포함 8~16자 */
export function checkPassword(pw = '') {
  return {
    length: pw.length >= 8 && pw.length <= 16,
    letter: /[A-Za-z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[^A-Za-z0-9\s]/.test(pw),
    noSpace: !/\s/.test(pw),
  };
}
export const isPasswordValid = (pw) => Object.values(checkPassword(pw)).every(Boolean);

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

/** 기간 안내 문구: "2027.11.01까지" / "기한 없음" */
export function periodText(plan, expiresAt) {
  if (expiresAt) return `${formatDate(expiresAt)}까지`;
  if (!plan) return '-';
  if (plan.term === 'ANNUAL') return '결제일로부터 1년';
  if (plan.term === 'TEN_YEARS') return '결제일로부터 10년';
  return '기한 없음';
}
