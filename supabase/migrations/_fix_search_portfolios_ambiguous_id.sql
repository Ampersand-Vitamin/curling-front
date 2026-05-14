-- search_portfolios RPC 버그 수정
-- 원인: `JOIN public.portfolio p USING (id)` 와 `designer_profile.id` 가 SELECT 절에서 충돌
-- 수정: USING(id) → ON f.id = p.id  +  SELECT 에 p. 접두 명시
--
-- Supabase Dashboard → SQL Editor 에서 통째로 실행

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
        p.id AS pid,
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
        p.id AS pid,
        ROW_NUMBER() OVER (ORDER BY p.embedding <=> query_embedding) AS rank
      FROM public.portfolio p
      WHERE query_embedding IS NOT NULL
        AND p.embedding IS NOT NULL
        AND (NOT has_keywords OR p.keywords && filter_keywords)
      LIMIT 100
    ),
    fused AS (
      SELECT u.pid, SUM(1.0 / (60.0 + u.rank)) AS rrf
      FROM (
        SELECT pid, rank FROM kw_match
        UNION ALL
        SELECT pid, rank FROM vec_match
      ) u
      GROUP BY u.pid
    )
  SELECT
    p.id,
    p.designer_id,
    p.image_path,
    p.title::TEXT,
    p.description,
    p.keywords,
    d.display_name::TEXT,
    d.profile_image_url::TEXT,
    d.salon_id,
    s.name::TEXT,
    d.rating_avg::DOUBLE PRECISION,
    f.rrf::DOUBLE PRECISION AS score
  FROM fused f
  JOIN public.portfolio p ON p.id = f.pid
  JOIN public.designer_profile d ON d.id = p.designer_id
  LEFT JOIN public.salon s ON s.id = d.salon_id
  ORDER BY f.rrf DESC
  LIMIT result_limit OFFSET result_offset;
END;
$$;
