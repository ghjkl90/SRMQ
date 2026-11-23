-- 005: 회원권 이용 기간 — 기한 없는 회원권 없애기 (토스페이먼츠 심사 보완)
--   * 준회원 · 종신회원: 1회 결제로 결제일부터 10년 (만료 90일 전부터 같은 금액으로 다시 10년 연장)
--   * 이미 기한 없이 가진 자격(예전 가입 · 회원명부 이관)은 그대로 둡니다.
--   * 일반 회원 표시 순서: 종신회원 → 정회원 → 준회원 → 단체회원

ALTER TABLE membership_plans DROP CONSTRAINT IF EXISTS membership_plans_term_check;
ALTER TABLE membership_plans
  ADD CONSTRAINT membership_plans_term_check CHECK (term IN ('ANNUAL', 'TEN_YEARS', 'PERMANENT', 'LIFETIME'));

UPDATE membership_plans SET term = 'TEN_YEARS' WHERE code IN ('ASSOCIATE', 'LIFETIME');

UPDATE membership_plans SET sort_order = 10 WHERE code = 'LIFETIME';
UPDATE membership_plans SET sort_order = 20 WHERE code = 'REGULAR';
UPDATE membership_plans SET sort_order = 30 WHERE code = 'ASSOCIATE';

UPDATE membership_plans
   SET benefits = (
     SELECT jsonb_agg(
              CASE WHEN b = to_jsonb('연회비 없이 회원 자격 유지'::text) THEN to_jsonb('연회비 없이 10년간 회원 자격 유지'::text) ELSE b END
              ORDER BY i)
       FROM jsonb_array_elements(benefits) WITH ORDINALITY AS t(b, i))
 WHERE code = 'LIFETIME' AND jsonb_array_length(benefits) > 0;
