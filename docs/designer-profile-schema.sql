-- ============================================================
-- Designer Profile Schema Extension
-- onboarding_profiles에 누락 필드 추가 + 포트폴리오 테이블 생성
-- ============================================================

-- 1. onboarding_profiles 필드 추가
ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS title        TEXT,          -- 호칭: '원장', '디자이너', 'Senior Stylist'
  ADD COLUMN IF NOT EXISTS bio          TEXT,          -- 소개글
  ADD COLUMN IF NOT EXISTS career_years INT,           -- 경력 (년)
  ADD COLUMN IF NOT EXISTS specialty    TEXT[];        -- 전문 분야: ['perm', 'color', 'cut']

-- 2. 포트폴리오 사진 테이블 (디자이너당 최대 4장 권장)
CREATE TABLE IF NOT EXISTS designer_portfolio (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url   TEXT        NOT NULL,
  sort_order  INT         NOT NULL DEFAULT 0,          -- 0~3, 정렬 순서
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_designer_portfolio_designer
  ON designer_portfolio(designer_id, sort_order);

-- 3. RLS
ALTER TABLE designer_portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_select_all" ON designer_portfolio;
DROP POLICY IF EXISTS "portfolio_insert_own" ON designer_portfolio;
DROP POLICY IF EXISTS "portfolio_update_own" ON designer_portfolio;
DROP POLICY IF EXISTS "portfolio_delete_own" ON designer_portfolio;

CREATE POLICY "portfolio_select_all"
  ON designer_portfolio FOR SELECT USING (true);

CREATE POLICY "portfolio_insert_own"
  ON designer_portfolio FOR INSERT
  WITH CHECK (designer_id = auth.uid());

CREATE POLICY "portfolio_update_own"
  ON designer_portfolio FOR UPDATE
  USING (designer_id = auth.uid());

CREATE POLICY "portfolio_delete_own"
  ON designer_portfolio FOR DELETE
  USING (designer_id = auth.uid());

-- 4. 테스트 디자이너 샘플 데이터 업데이트
UPDATE onboarding_profiles SET
  title        = '원장',
  bio          = 'Specializing in curl care and color for all hair types.',
  career_years = 8,
  specialty    = ARRAY['perm', 'color', 'cut']
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';  -- Sejin / Salon de Sea

UPDATE onboarding_profiles SET
  title        = '디자이너',
  bio          = 'Expert in Korean hair trends and styling for fine hair.',
  career_years = 5,
  specialty    = ARRAY['cut', 'styling', 'treatment']
WHERE user_id = 'a0000000-0000-0000-0000-000000000002';  -- Mina / Hair Studio M

UPDATE onboarding_profiles SET
  title        = 'Senior Stylist',
  bio          = 'Curl specialist with international experience.',
  career_years = 10,
  specialty    = ARRAY['curly', 'color', 'perm']
WHERE user_id = 'a0000000-0000-0000-0000-000000000003';  -- Amy / The Curl Bar
