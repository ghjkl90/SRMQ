// src/hooks/useMembershipPlans.js — 회원등급 목록(금액 · 혜택)을 서버에서 불러옵니다.
import { useEffect, useState } from 'react';
import { api } from '../api/client';

let cache = null;

export function useMembershipPlans() {
  const [plans, setPlans] = useState(cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cache) return undefined;
    let alive = true;
    api
      .get('/api/plans')
      .then((data) => {
        cache = data.plans;
        if (alive) setPlans(data.plans);
      })
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, []);

  return { plans, error, loading: !plans && !error };
}

export const groupPlans = (plans = []) => ({
  GENERAL: plans.filter((p) => p.category === 'GENERAL'),
  CORPORATE: plans.filter((p) => p.category === 'CORPORATE'),
  SPECIAL: plans.filter((p) => p.category === 'SPECIAL'),
});

/** 카드에 보여 줄 금액 문구 */
export function planFeeText(plan) {
  if (!plan) return '';
  const won = (n) => n.toLocaleString('ko-KR');
  if (plan.joinFee && plan.annualFee) return `입회비 ${won(plan.joinFee)}원 + 연회비 ${won(plan.annualFee)}원`;
  if (plan.joinFee) return `입회비 ${won(plan.joinFee)}원 (연회비 없음)`;
  return `연회비 ${won(plan.annualFee)}원`;
}
