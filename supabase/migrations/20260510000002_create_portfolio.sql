-- Phase 3 — Portfolio 테이블 (Style 탭 검색 대상)
--
-- 검색 단위 = portfolio 1행. 한 디자이너가 여러 portfolio 를 가짐.
-- 기존 designer_profile.portfolio_images 는 그대로 유지 (디자이너 상세 캐러셀용).
-- 이 테이블은 검색 + 메타데이터(title/description/keywords) + 벡터/tsvector 인덱스 전용.

CREATE TABLE IF NOT EXISTS public.portfolio (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id   UUID NOT NULL REFERENCES public.designer_profile(id) ON DELETE CASCADE,
  image_path    TEXT NOT NULL,                                       -- raw storage path
  title         VARCHAR(200) NOT NULL,
  description   TEXT,                                                -- 자연어 작품 설명 (50~150자 권장)
  keywords      TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],             -- keyword.slug 와 정합
  display_order INT NOT NULL DEFAULT 0,                              -- 디자이너 내 정렬
  embedding     vector(1536),                                        -- text-embedding-3-large reduced
  search_doc    tsvector,                                            -- BM25 보강 (auto-update)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 같은 디자이너의 같은 image_path 중복 방지 (시드 idempotency 보조)
  CONSTRAINT portfolio_designer_image_unique UNIQUE (designer_id, image_path)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_portfolio_designer ON public.portfolio (designer_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_keywords ON public.portfolio USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_portfolio_search   ON public.portfolio USING GIN (search_doc);

-- HNSW: pgvector 0.5+ 필요. Supabase 기본 활성. 코사인 거리.
CREATE INDEX IF NOT EXISTS idx_portfolio_embedding
  ON public.portfolio USING hnsw (embedding vector_cosine_ops);

-- search_doc 자동 갱신 trigger
-- title:A (강), keywords:B, description:C 가중치
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

COMMENT ON TABLE  public.portfolio IS 'Designer portfolio entries — Style tab 검색 대상';
COMMENT ON COLUMN public.portfolio.image_path  IS 'Supabase Storage 경로 — UI 에서 storageUrl() 적용';
COMMENT ON COLUMN public.portfolio.keywords    IS 'keyword.slug 배열 — Style 탭 추천 칩과 정합';
COMMENT ON COLUMN public.portfolio.embedding   IS 'OpenAI text-embedding-3-large dimensions=1536';
COMMENT ON COLUMN public.portfolio.search_doc  IS 'tsvector — title(A) + keywords(B) + description(C) trigger 자동 갱신';
