-- 004: 메인 화면 슬라이드 · 베스트 기업 순위
--   * home_slides: 메인 화면 사진 슬라이드. 사진 파일은 포상갤러리와 같은 uploads 를 씁니다.
--     갤러리 사진을 그대로 골라 쓸 수 있어서, 같은 파일을 갤러리와 슬라이드가 함께 참조할 수 있습니다.
--   * best_companies: 베스트 기업 순위. 점수가 높은 순서로 1~3위는 그래프, 나머지는 이름만 표시합니다.
--   * site_settings: 화면 문구처럼 한 벌만 있는 설정값 (예: 베스트 기업 제목 · 평가 기준 · 단위)

CREATE TABLE IF NOT EXISTS home_slides (
  id         BIGSERIAL PRIMARY KEY,
  image_key  TEXT NOT NULL REFERENCES uploads (key),
  caption    TEXT NOT NULL DEFAULT '',
  link_url   TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by BIGINT REFERENCES users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS home_slides_sort_idx ON home_slides (sort_order, id);

CREATE TABLE IF NOT EXISTS best_companies (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT '',
  score      NUMERIC(12, 2) NOT NULL CHECK (score >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_by BIGINT REFERENCES users (id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS best_companies_rank_idx ON best_companies (score DESC, sort_order, id);

CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by BIGINT REFERENCES users (id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
