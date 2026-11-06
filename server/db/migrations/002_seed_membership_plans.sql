-- 002_seed_membership_plans.sql
-- 회원 안내 페이지(MembersPage)의 일반 · 기업 · 특별 회원 구분과 금액을 그대로 옮긴 기본값입니다.
-- 금액이나 혜택이 바뀌면 이 파일을 고치지 말고, 운영 DB에서 UPDATE 하세요.
--   예) UPDATE membership_plans SET annual_fee = 60000 WHERE code = 'REGULAR';

INSERT INTO membership_plans
  (code, category, name, name_en, short_label, join_fee, annual_fee, term, member_type, voting_rights, benefits, badge_tone, sort_order)
VALUES
  -- 1. 일반 회원
  ('ASSOCIATE', 'GENERAL', '준회원', 'Associate Member', '준회원', 50000, 0, 'PERMANENT', 'INDIVIDUAL', true,
   '["총회 참석 및 의결권 부여", "본원 산하 분과 · 연구회 등 모든 사업에 참여 가능", "본원 소식 및 행사정보 이메일 수신"]',
   'lime', 10),
  ('REGULAR', 'GENERAL', '정회원', 'Regular Member', '정회원', 100000, 50000, 'ANNUAL', 'INDIVIDUAL', true,
   '["총회 참석 및 의결권 부여", "본원 산하 분과 · 연구회 등 모든 사업에 참여 가능", "본원 소식 및 행사정보 이메일 수신"]',
   'lime', 20),
  ('LIFETIME', 'GENERAL', '종신회원', 'Lifetime Member', '종신회원', 500000, 0, 'LIFETIME', 'INDIVIDUAL', false,
   '["본원 산하 분과 · 연구회 등 모든 사업에 참여 가능", "본원 소식 및 행사정보 이메일 수신", "연회비 없이 회원 자격 유지"]',
   'lime', 30),
  ('GROUP', 'GENERAL', '단체회원', 'Group Member', '단체회원', 0, 100000, 'ANNUAL', 'ANY', false,
   '["본원 산하 분과 · 연구회 등 모든 사업에 참여 가능", "본원 소식 및 행사정보 이메일 수신"]',
   'lime', 40),

  -- 2. 기업 회원
  ('NES', 'CORPORATE', '내셔널 ESG', 'National ESG', 'NES', 0, 2000000, 'ANNUAL', 'ORGANIZATION', false,
   '["우수사례 연 1회 공유", "컨벤션 연 2명 참석제공", "K-AI 그린벨트 2명 교육"]',
   'green', 50),
  ('BES', 'CORPORATE', '베스트 ESG', 'Best ESG', 'BES', 0, 3000000, 'ANNUAL', 'ORGANIZATION', false,
   '["우수사례 연 2회 공유", "컨벤션 연 1회 홍보", "컨벤션 연 3명 참석 제공", "K-AI 그린벨트 1명 + 블랙벨트 1명 교육"]',
   'green', 60),
  ('GES', 'CORPORATE', '글로벌 ESG', 'Global ESG', 'GES', 0, 5000000, 'ANNUAL', 'ORGANIZATION', false,
   '["국내·국제 간행물 발송", "컨벤션 연 1회 홍보", "컨벤션 5명 이내 참석 제공", "K-AI 그린벨트 2명 + 블랙벨트 2명 교육"]',
   'blue', 70),

  -- 3. 특별 회원
  ('SPECIAL', 'SPECIAL', '특별회원', 'Special Member', 'SPECIAL', 0, 10000000, 'ANNUAL', 'ORGANIZATION', false,
   '["기업회원 중 글로벌 ESG(GES)과 동일한 혜택 제공", "특별회원 후원금은 본원 발전을 위해 사용하며, 사용용도를 지정할 수 있음", "ANQ (아시아품질네트워크) 사례발표 및 우수사례 (AREQP) 포상 지원"]',
   'special', 80)
ON CONFLICT (code) DO NOTHING;
