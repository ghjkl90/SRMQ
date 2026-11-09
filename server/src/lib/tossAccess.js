// src/lib/tossAccess.js
// 카드 · 간편결제(토스페이먼츠)를 이 회원에게 열어 줄지, 이 금액을 카드로 받을 수 있는지 판단합니다.

/** 토스 키가 있고, 테스트 키 기간이면 허용 계정(TOSS_TEST_ALLOWED_EMAILS)인지 */
export function tossAvailableFor(config, toss, user) {
  if (!config.toss.clientKey || !toss.isConfigured) return false;
  const testMode = config.toss.clientKey.startsWith('test_');
  const allowed = config.toss.testAllowedEmails;
  if (testMode && allowed.length > 0) return Boolean(user && allowed.includes(String(user.email).toLowerCase()));
  return true;
}

/** 카드 · 간편결제 한도(TOSS_MAX_AMOUNT) 이상인지 */
export const overTossLimit = (config, amount) => config.toss.maxAmount > 0 && amount >= config.toss.maxAmount;
