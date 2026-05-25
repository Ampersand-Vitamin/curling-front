-- Favorite 테이블 — 디자이너/포트폴리오 찜하기
--
-- target_type: 'designer' → target_id = designer_profile.id
--              'portfolio' → target_id = portfolio.id
-- FK 없이 target_id 관리 (polymorphic pattern).
-- RLS: 본인 행만 읽기/쓰기.

CREATE TABLE IF NOT EXISTS public.favorite (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('designer', 'portfolio')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT favorite_unique UNIQUE (user_id, target_type, target_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_favorite_user       ON public.favorite (user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_target      ON public.favorite (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_favorite_user_type   ON public.favorite (user_id, target_type);

-- RLS
ALTER TABLE public.favorite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON public.favorite FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.favorite FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.favorite FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE  public.favorite IS 'User favorites — designer/portfolio polymorphic';
COMMENT ON COLUMN public.favorite.target_type IS '''designer'' or ''portfolio''';
COMMENT ON COLUMN public.favorite.target_id   IS 'designer_profile.id or portfolio.id';
