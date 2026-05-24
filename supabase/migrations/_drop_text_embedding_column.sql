-- portfolio-visual-embedding — Cleanup: drop unused text embedding column
--
-- 배경:
--   Module 5 NL 회귀 게이트 + Cross-modal v2 (search_portfolios_clip_v2) 적용 후
--   자연어 검색이 query_embedding(CLIP text) 와 image_embedding(CLIP image) 를 직접 매칭한다.
--   portfolio.embedding (텍스트 임베딩) 컬럼은 더 이상 어디서도 읽지 않으므로 안전하게 DROP.
--
-- 적용:
--   Supabase Dashboard → SQL Editor 통째로 붙여넣고 Run.

BEGIN;

-- 1) HNSW 인덱스 drop
DROP INDEX IF EXISTS public.idx_portfolio_embedding;

-- 2) 컬럼 drop
ALTER TABLE public.portfolio DROP COLUMN IF EXISTS embedding;

COMMIT;

-- 검증
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='portfolio'
--  ORDER BY ordinal_position;
-- → embedding 컬럼이 보이지 않아야 함. image_embedding 만 남아있어야 함.
