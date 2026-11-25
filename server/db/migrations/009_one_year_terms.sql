UPDATE membership_plans
   SET term = 'ANNUAL', annual_fee = join_fee, join_fee = 0, updated_at = now()
 WHERE term = 'TEN_YEARS';

UPDATE membership_plans
   SET benefits = (
     SELECT coalesce(jsonb_agg(b ORDER BY i), '[]'::jsonb)
       FROM jsonb_array_elements(benefits) WITH ORDINALITY AS t(b, i)
      WHERE b <> to_jsonb('연회비 없이 10년간 회원 자격 유지'::text))
 WHERE code = 'LIFETIME';

ALTER TABLE membership_plans DROP CONSTRAINT IF EXISTS membership_plans_term_check;
ALTER TABLE membership_plans
  ADD CONSTRAINT membership_plans_term_check CHECK (term IN ('ANNUAL', 'PERMANENT', 'LIFETIME'));
