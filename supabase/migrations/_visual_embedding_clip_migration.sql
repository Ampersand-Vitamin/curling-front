-- portfolio-visual-embedding — Schema migration
-- Design Ref: §2 — Option B (CLIP unified 768d)
--
-- ⚠ Destructive: 기존 portfolio.embedding(1536) 데이터 360 rows 가 버려진다.
--    뒤이어 `pnpm portfolio:embed-clip` 로 CLIP 으로 재시드 필요.
--
-- 적용:
--   Supabase Dashboard → SQL Editor 에 통째로 붙여넣고 Run.

BEGIN;

-- 1) 기존 HNSW 인덱스 drop (vector(1536) 의존)
DROP INDEX IF EXISTS public.idx_portfolio_embedding;

-- 2) embedding 컬럼 차원 변경 (1536 → 768)
ALTER TABLE public.portfolio DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.portfolio ADD COLUMN embedding vector(768);

-- 3) image_embedding 컬럼 추가 (신규)
ALTER TABLE public.portfolio
  ADD COLUMN IF NOT EXISTS image_embedding vector(768);

-- 4) 새 HNSW 인덱스 (cosine 거리)
CREATE INDEX IF NOT EXISTS idx_portfolio_embedding
  ON public.portfolio USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_portfolio_image_embedding
  ON public.portfolio USING hnsw (image_embedding vector_cosine_ops);

-- 5) cleanup — designer_keyword 시드 완료 후 _temp_* DROP
ALTER TABLE public.designer_profile
  DROP COLUMN IF EXISTS _temp_specialties,
  DROP COLUMN IF EXISTS _temp_hair_type_experience;

COMMIT;

-- 검증
-- SELECT
--   column_name, data_type,
--   (SELECT atttypmod FROM pg_attribute WHERE attrelid = 'public.portfolio'::regclass AND attname = column_name) AS typmod
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'portfolio'
-- ORDER BY ordinal_position;
