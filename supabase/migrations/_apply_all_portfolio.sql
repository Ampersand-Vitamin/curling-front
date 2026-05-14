-- ════════════════════════════════════════════════════════════════════
-- Portfolio 검색 인프라 — 3개 마이그레이션 통합본
-- Supabase Dashboard → SQL Editor 에 통째로 붙여넣고 Run
--
-- 포함:
--   1) pgvector 확장
--   2) portfolio 테이블 + trigger + 인덱스 (HNSW + GIN)
--   3) search_portfolios RPC (BM25 + vector RRF)
-- ════════════════════════════════════════════════════════════════════

-- ── 1. pgvector ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 2. portfolio 테이블 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portfolio (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id   UUID NOT NULL REFERENCES public.designer_profile(id) ON DELETE CASCADE,
  image_path    TEXT NOT NULL,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  keywords      TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  display_order INT NOT NULL DEFAULT 0,
  embedding     vector(1536),
  search_doc    tsvector,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT portfolio_designer_image_unique UNIQUE (designer_id, image_path)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_designer ON public.portfolio (designer_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_keywords ON public.portfolio USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_portfolio_search   ON public.portfolio USING GIN (search_doc);
CREATE INDEX IF NOT EXISTS idx_portfolio_embedding
  ON public.portfolio USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.portfolio_search_doc_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_doc :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', array_to_string(NEW.keywords, ' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_portfolio_search_doc ON public.portfolio;
CREATE TRIGGER trg_portfolio_search_doc
BEFORE INSERT OR UPDATE OF title, keywords, description ON public.portfolio
FOR EACH ROW EXECUTE FUNCTION public.portfolio_search_doc_update();

-- ── 3. search_portfolios RPC ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_portfolios(
  query_text       TEXT,
  query_embedding  vector(1536),
  filter_keywords  TEXT[],
  result_limit     INT  DEFAULT 30,
  result_offset    INT  DEFAULT 0
)
RETURNS TABLE (
  id                UUID,
  designer_id       UUID,
  image_path        TEXT,
  title             TEXT,
  description       TEXT,
  keywords          TEXT[],
  display_name      TEXT,
  profile_image_url TEXT,
  salon_id          UUID,
  salon_name        TEXT,
  rating_avg        DOUBLE PRECISION,
  score             DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  has_query     BOOLEAN := COALESCE(LENGTH(BTRIM(query_text)) > 0, FALSE);
  has_keywords  BOOLEAN := filter_keywords IS NOT NULL
                            AND array_length(filter_keywords, 1) IS NOT NULL;
BEGIN
  IF NOT has_query THEN
    RETURN QUERY
    SELECT
      p.id,
      p.designer_id,
      p.image_path,
      p.title::TEXT,
      p.description,
      p.keywords,
      d.display_name::TEXT,
      d.profile_image_url,
      d.salon_id,
      s.name::TEXT,
      d.rating_avg::DOUBLE PRECISION,
      d.rating_avg::DOUBLE PRECISION AS score
    FROM public.portfolio p
    JOIN public.designer_profile d ON d.id = p.designer_id
    LEFT JOIN public.salon s ON s.id = d.salon_id
    WHERE NOT has_keywords OR p.keywords && filter_keywords
    ORDER BY d.rating_avg DESC NULLS LAST,
             d.review_count DESC NULLS LAST,
             p.display_order ASC
    LIMIT result_limit OFFSET result_offset;
    RETURN;
  END IF;

  RETURN QUERY
  WITH
    kw_match AS (
      SELECT
        p.id,
        ROW_NUMBER() OVER (
          ORDER BY ts_rank(p.search_doc, websearch_to_tsquery('simple', query_text)) DESC
        ) AS rank
      FROM public.portfolio p
      WHERE p.search_doc @@ websearch_to_tsquery('simple', query_text)
        AND (NOT has_keywords OR p.keywords && filter_keywords)
      LIMIT 100
    ),
    vec_match AS (
      SELECT
        p.id,
        ROW_NUMBER() OVER (ORDER BY p.embedding <=> query_embedding) AS rank
      FROM public.portfolio p
      WHERE query_embedding IS NOT NULL
        AND p.embedding IS NOT NULL
        AND (NOT has_keywords OR p.keywords && filter_keywords)
      LIMIT 100
    ),
    fused AS (
      SELECT u.id, SUM(1.0 / (60.0 + u.rank)) AS rrf
      FROM (
        SELECT id, rank FROM kw_match
        UNION ALL
        SELECT id, rank FROM vec_match
      ) u
      GROUP BY u.id
    )
  SELECT
    p.id,
    p.designer_id,
    p.image_path,
    p.title::TEXT,
    p.description,
    p.keywords,
    d.display_name::TEXT,
    d.profile_image_url,
    d.salon_id,
    s.name::TEXT,
    d.rating_avg::DOUBLE PRECISION,
    f.rrf AS score
  FROM fused f
  JOIN public.portfolio p USING (id)
  JOIN public.designer_profile d ON d.id = p.designer_id
  LEFT JOIN public.salon s ON s.id = d.salon_id
  ORDER BY f.rrf DESC
  LIMIT result_limit OFFSET result_offset;
END;
$$;
