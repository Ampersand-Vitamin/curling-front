-- Phase 1 — Salon 테이블 (ERD §3.2)
-- docs/01-plan/erd.md §3.2 Salon 참조

CREATE TABLE IF NOT EXISTS public.salon (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref   VARCHAR(10) UNIQUE,                       -- Mock _ref (S001 등). 시드 완료 후 DROP 예정
  name           VARCHAR(200) NOT NULL,
  address        VARCHAR(500) NOT NULL,
  latitude       DECIMAL(10, 7) NOT NULL,
  longitude      DECIMAL(10, 7) NOT NULL,
  phone          VARCHAR(20),
  type           VARCHAR(20) NOT NULL
                 CHECK (type IN ('salon', 'barber', 'specialty', 'independent')),
  neighborhood   VARCHAR(50),
  introduction   TEXT,
  languages      VARCHAR(20)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(20)[],
  is_featured    BOOLEAN NOT NULL DEFAULT false,
  designer_count INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ERD §3.6 인덱스
CREATE INDEX IF NOT EXISTS idx_salon_lat_lng        ON public.salon (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_salon_type           ON public.salon (type);
CREATE INDEX IF NOT EXISTS idx_salon_neighborhood   ON public.salon (neighborhood);

COMMENT ON COLUMN public.salon.external_ref   IS 'Mock JSON _ref (S001 등). Phase 1 seed 완료 후 DROP';
COMMENT ON COLUMN public.salon.languages      IS '대응 가능 언어 배열 — [english], [english_partial] 등';
COMMENT ON COLUMN public.salon.designer_count IS 'Mock 시드 시 number_of_designers 값, 추후 designer_profile 시드 후 COUNT로 재집계';
COMMENT ON COLUMN public.salon.is_featured    IS '추천 살롱 여부 — 초기 false, 운영 중 수동 지정';

-- TODO(phase-later): 반경 검색(ST_DWithin)이 필요해지면 PostGIS EXTENSION + geography 컬럼 + GiST 인덱스로 전환
