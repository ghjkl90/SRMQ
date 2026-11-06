-- 003: 0원 테스트 결제 · 회원명부 이관
--   * 결제 수단에 TEST(0원 테스트 결제) 추가. 금액 0원은 TEST 주문에서만 허용
--   * 회원명부에서 옮긴 계정 구분(source)과 비밀번호 설정 여부(password_set)
--   * 명부로 옮긴 회원은 사이트 약관에 아직 동의하지 않았으므로 동의 시각을 비워 둘 수 있게 함
--     (처음 비밀번호를 만들 때 동의를 받습니다)

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_method_check CHECK (method IN ('TOSS', 'BANK_TRANSFER', 'TEST'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_amount_check;
ALTER TABLE orders ADD CONSTRAINT orders_amount_check CHECK (amount > 0 OR (method = 'TEST' AND amount = 0));

ALTER TABLE users ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'SIGNUP';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_source_check;
ALTER TABLE users ADD CONSTRAINT users_source_check CHECK (source IN ('SIGNUP', 'ADMIN', 'IMPORT'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_set BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE users ALTER COLUMN terms_agreed_at DROP NOT NULL;
ALTER TABLE users ALTER COLUMN privacy_agreed_at DROP NOT NULL;

UPDATE users SET source = 'ADMIN' WHERE role = 'ADMIN' AND source = 'SIGNUP';
