-- Phase 3 — search_portfolios RPC function
--
-- Style 탭 hybrid 검색 진입점. supabase-js 의 .rpc('search_portfolios', {...}) 로 호출.
-- 분기:
--   (1) query 비어있고 keyword 도 없음    → ratingAvg desc 정렬 (초기 그리드)
--   (2) query 비어있고 keyword 만 있음    → 키워드 필터 + ratingAvg desc
--   (3) query 있음 (keyword 옵션)        → BM25(tsvector) + 벡터(pgvector) RRF
--
-- RRF k=60 표준값. 두 ranker 의 순위 역수 합으로 fusion.

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
  -- (1)(2) Empty-query path: 정렬은 평점 + 리뷰 수
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

  -- (3) Hybrid RRF
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

COMMENT ON FUNCTION public.search_portfolios IS
  'Style 탭 hybrid 검색 — RRF (BM25 + 벡터) k=60. 빈 쿼리는 ratingAvg 정렬로 분기.';
