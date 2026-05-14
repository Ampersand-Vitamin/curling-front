-- portfolio-visual-embedding — RPC v2 (true cross-modal)
--
-- 변경:
--   자연어 검색의 vec_match 가 portfolio.embedding (텍스트 임베딩) 대신
--   portfolio.image_embedding (픽셀 임베딩) 과 비교한다.
--
-- 왜:
--   CLIP 은 text-image pair 학습 모델이라 text query ↔ image embedding cosine 거리가 의미 정합.
--   기존(embedding=text) 매칭은 한 다리 거친 description 의 시각 정보 손실 그대로 노출.
--   image_embedding 직접 매칭이 CLIP 의 본래 강점이자 "색조 손실" 문제의 진짜 해결.
--
-- 적용:
--   Supabase Dashboard → SQL Editor 통째로 붙여넣고 Run.

DROP FUNCTION IF EXISTS public.search_portfolios(TEXT, vector, TEXT[], INT, INT, vector);

CREATE OR REPLACE FUNCTION public.search_portfolios(
  query_text             TEXT,
  query_embedding        vector(768),     -- CLIP text query
  filter_keywords        TEXT[],
  result_limit           INT  DEFAULT 30,
  result_offset          INT  DEFAULT 0,
  query_image_embedding  vector(768) DEFAULT NULL
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
  -- ── (사진 검색) image_embedding cosine ──────────────
  IF query_image_embedding IS NOT NULL THEN
    RETURN QUERY
    SELECT
      p.id, p.designer_id, p.image_path, p.title::TEXT, p.description, p.keywords,
      d.display_name::TEXT, d.profile_image_url::TEXT, d.salon_id, s.name::TEXT,
      d.rating_avg::DOUBLE PRECISION,
      (1.0 - (p.image_embedding <=> query_image_embedding))::DOUBLE PRECISION AS score
    FROM public.portfolio p
    JOIN public.designer_profile d ON d.id = p.designer_id
    LEFT JOIN public.salon s ON s.id = d.salon_id
    WHERE p.image_embedding IS NOT NULL
      AND (NOT has_keywords OR p.keywords && filter_keywords)
    ORDER BY p.image_embedding <=> query_image_embedding ASC
    LIMIT result_limit OFFSET result_offset;
    RETURN;
  END IF;

  -- ── (빈 쿼리) rating fallback ──────────────────────
  IF NOT has_query THEN
    RETURN QUERY
    SELECT
      p.id, p.designer_id, p.image_path, p.title::TEXT, p.description, p.keywords,
      d.display_name::TEXT, d.profile_image_url::TEXT, d.salon_id, s.name::TEXT,
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

  -- ── (자연어) BM25 + CROSS-MODAL CLIP RRF ──────────
  -- ⚠ vec_match 가 p.embedding → p.image_embedding 으로 변경됨
  --   query_embedding(CLIP text) 와 image_embedding(CLIP image) 가 같은 768d 공간이라 cross-modal 가능.
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
        ROW_NUMBER() OVER (ORDER BY p.image_embedding <=> query_embedding) AS rank
      FROM public.portfolio p
      WHERE query_embedding IS NOT NULL
        AND p.image_embedding IS NOT NULL  -- ← image_embedding 사용 (cross-modal)
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
    p.id, p.designer_id, p.image_path, p.title::TEXT, p.description, p.keywords,
    d.display_name::TEXT, d.profile_image_url::TEXT, d.salon_id, s.name::TEXT,
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
