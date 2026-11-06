// src/routes/plans.js  →  /api/plans
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { buildQuote } from '../services/membership.js';
import { getPlan, listPlans, serializePlan } from '../services/plans.js';

export default function planRoutes({ db }) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const plans = await listPlans(db);
    res.json({ plans: plans.map(serializePlan) });
  });

  // 로그인한 회원 기준 결제 금액 미리보기 (신규 · 등급변경 · 갱신 자동 판단)
  router.get('/:code/quote', requireAuth, async (req, res) => {
    const plan = await getPlan(db, req.params.code);
    const quote = buildQuote(req.user, plan);
    res.json({ plan: serializePlan(plan), quote });
  });

  return router;
}
