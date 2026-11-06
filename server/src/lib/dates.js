// src/lib/dates.js
export function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
}

/** 2026.11.02 형식 (한국 시간) */
export function formatKstDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(date))
    .replace(/\.\s?/g, '.')
    .replace(/\.$/, '');
}

export const formatWon = (amount) => `${Number(amount || 0).toLocaleString('ko-KR')}원`;
