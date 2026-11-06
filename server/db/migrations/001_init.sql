-- 001_init.sql : 회원 · 회원등급 · 주문/결제 · 비밀번호 재설정 · 탈퇴 · 업로드 · 포상갤러리

-- 회원등급 (회원 안내 페이지의 표/카드와 같은 내용. 금액을 바꿀 때는 이 테이블만 수정)
CREATE TABLE membership_plans (
  code          TEXT PRIMARY KEY,
  category      TEXT NOT NULL CHECK (category IN ('GENERAL', 'CORPORATE', 'SPECIAL')),
  name          TEXT NOT NULL,
  name_en       TEXT NOT NULL DEFAULT '',
  short_label   TEXT NOT NULL DEFAULT '',
  join_fee      INTEGER NOT NULL DEFAULT 0 CHECK (join_fee >= 0),      -- 입회비 (최초 1회)
  annual_fee    INTEGER NOT NULL DEFAULT 0 CHECK (annual_fee >= 0),    -- 연회비
  term          TEXT NOT NULL CHECK (term IN ('ANNUAL', 'PERMANENT', 'LIFETIME')),
  member_type   TEXT NOT NULL DEFAULT 'ANY' CHECK (member_type IN ('INDIVIDUAL', 'ORGANIZATION', 'ANY')),
  voting_rights BOOLEAN NOT NULL DEFAULT false,
  benefits      JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge_tone    TEXT NOT NULL DEFAULT 'lime',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id                    BIGSERIAL PRIMARY KEY,
  email                 TEXT NOT NULL UNIQUE CHECK (email = lower(email)),  -- 아이디
  password_hash         TEXT NOT NULL,
  role                  TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'ADMIN')),
  status                TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'WITHDRAWN')),
  member_type           TEXT NOT NULL DEFAULT 'INDIVIDUAL' CHECK (member_type IN ('INDIVIDUAL', 'ORGANIZATION')),
  name                  TEXT NOT NULL,            -- 개인: 성명 / 기업: 담당자 성명
  phone                 TEXT NOT NULL DEFAULT '',
  office_phone          TEXT,
  affiliation           TEXT,                     -- 소속 기관/기업명
  department            TEXT,
  position              TEXT,
  company_name          TEXT,                     -- 기업·특별회원 정보
  business_no           TEXT,
  ceo_name              TEXT,
  tax_email             TEXT,
  plan_code             TEXT REFERENCES membership_plans (code),
  membership_status     TEXT NOT NULL DEFAULT 'NONE' CHECK (membership_status IN ('NONE', 'ACTIVE')),
  membership_started_at TIMESTAMPTZ,
  membership_expires_at TIMESTAMPTZ,              -- NULL = 기한 없음 (종신회원 · 준회원)
  membership_order_id   BIGINT,
  sms_opt_in            BOOLEAN NOT NULL DEFAULT false,
  marketing_opt_in      BOOLEAN NOT NULL DEFAULT false,
  terms_agreed_at       TIMESTAMPTZ NOT NULL,
  privacy_agreed_at     TIMESTAMPTZ NOT NULL,
  customer_key          TEXT NOT NULL UNIQUE,     -- 토스페이먼츠 customerKey
  token_version         INTEGER NOT NULL DEFAULT 0,
  last_login_at         TIMESTAMPTZ,
  withdrawn_at          TIMESTAMPTZ,
  admin_memo            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX users_plan_idx ON users (plan_code, membership_status);
CREATE INDEX users_created_idx ON users (created_at DESC);

CREATE TABLE orders (
  id                 BIGSERIAL PRIMARY KEY,
  order_no           TEXT NOT NULL UNIQUE,         -- 토스페이먼츠 orderId
  user_id            BIGINT NOT NULL REFERENCES users (id),
  plan_code          TEXT NOT NULL REFERENCES membership_plans (code),
  order_type         TEXT NOT NULL CHECK (order_type IN ('NEW', 'RENEWAL', 'CHANGE')),
  order_name         TEXT NOT NULL,
  items              JSONB NOT NULL,               -- [{ type: JOIN_FEE|ANNUAL_FEE, label, amount }]
  amount             INTEGER NOT NULL CHECK (amount > 0),
  method             TEXT NOT NULL CHECK (method IN ('TOSS', 'BANK_TRANSFER')),
  status             TEXT NOT NULL CHECK (status IN (
                       'READY', 'CONFIRMING', 'WAITING_FOR_DEPOSIT', 'PAID', 'CANCELED', 'FAILED', 'EXPIRED')),
  payment_key        TEXT UNIQUE,
  pay_method_label   TEXT,                         -- 카드 / 가상계좌 / 간편결제(카카오페이) / 무통장입금
  toss_secret        TEXT,                         -- 가상계좌 입금 알림(웹훅) 검증값
  virtual_account    JSONB,
  receipt_url        TEXT,
  depositor_name     TEXT,
  deposit_due_at     TIMESTAMPTZ,
  receipt_type       TEXT NOT NULL DEFAULT 'NONE' CHECK (receipt_type IN ('NONE', 'CASH_RECEIPT', 'TAX_INVOICE')),
  receipt_info       JSONB,
  designated_purpose TEXT,                         -- 특별회원 후원금 사용용도 지정
  prev_membership    JSONB,                        -- 결제 반영 직전 회원 자격 (결제 취소 시 되돌리기용)
  failure_code       TEXT,
  failure_message    TEXT,
  admin_memo         TEXT,
  processed_by       BIGINT REFERENCES users (id), -- 입금확인 · 취소 처리한 관리자
  paid_at            TIMESTAMPTZ,
  canceled_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON orders (user_id, created_at DESC);
CREATE INDEX orders_status_idx ON orders (status, created_at DESC);

ALTER TABLE users
  ADD CONSTRAINT users_membership_order_fk
  FOREIGN KEY (membership_order_id) REFERENCES orders (id) ON DELETE SET NULL;

-- 결제 관련 모든 이벤트 기록 (승인 응답, 웹훅, 관리자 처리)
CREATE TABLE payment_events (
  id         BIGSERIAL PRIMARY KEY,
  order_no   TEXT,
  source     TEXT NOT NULL,       -- TOSS_CONFIRM | TOSS_WEBHOOK | ADMIN | SYSTEM | USER
  event_type TEXT NOT NULL,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payment_events_order_idx ON payment_events (order_no, created_at);

CREATE TABLE password_resets (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 탈퇴 기록 (이메일은 해시로만 보관 → 30일 재가입 제한에 사용)
CREATE TABLE withdrawals (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users (id),
  email_hash   TEXT NOT NULL,
  reason       TEXT NOT NULL,
  feedback     TEXT,
  plan_code    TEXT,
  withdrawn_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX withdrawals_email_idx ON withdrawals (email_hash, withdrawn_at DESC);

-- 업로드한 이미지 (갤러리에 연결되지 않은 파일은 24시간 뒤 자동 삭제)
CREATE TABLE uploads (
  id            BIGSERIAL PRIMARY KEY,
  key           TEXT NOT NULL UNIQUE,
  thumb_key     TEXT NOT NULL,
  width         INTEGER,
  height        INTEGER,
  size_bytes    INTEGER,
  original_name TEXT,
  attached      BOOLEAN NOT NULL DEFAULT false,
  detached_at   TIMESTAMPTZ,
  created_by    BIGINT REFERENCES users (id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 포상갤러리: 앨범(연도·제목) → 섹션(소제목) → 사진(캡션)
CREATE TABLE gallery_albums (
  id           BIGSERIAL PRIMARY KEY,
  year         INTEGER NOT NULL CHECK (year BETWEEN 1990 AND 2100),
  title        TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_by   BIGINT REFERENCES users (id),
  updated_by   BIGINT REFERENCES users (id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gallery_albums_year_idx ON gallery_albums (year DESC, sort_order, id);

CREATE TABLE gallery_sections (
  id         BIGSERIAL PRIMARY KEY,
  album_id   BIGINT NOT NULL REFERENCES gallery_albums (id) ON DELETE CASCADE,
  title      TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX gallery_sections_album_idx ON gallery_sections (album_id, sort_order);

CREATE TABLE gallery_photos (
  id         BIGSERIAL PRIMARY KEY,
  section_id BIGINT NOT NULL REFERENCES gallery_sections (id) ON DELETE CASCADE,
  image_key  TEXT NOT NULL REFERENCES uploads (key),
  caption    TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX gallery_photos_section_idx ON gallery_photos (section_id, sort_order);
