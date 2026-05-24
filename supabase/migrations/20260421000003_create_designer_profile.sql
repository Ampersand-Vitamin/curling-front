-- Phase 1 — DesignerProfile 테이블 (ERD §3.2)
--
-- 주의:
--   * user_id는 NULLABLE + FK 없음 — Auth 연결 PDCA 시점에 FK 추가
--   * hair_type_experience 배열 컬럼 삭제 (→ designer_keyword로 통일)
--   * _temp_specialties / _temp_hair_type_experience 는 시드 전용 임시 컬럼
--     designer_keyword 시드 완료 후 DROP 예정

CREATE TABLE IF NOT EXISTS public.designer_profile (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref      VARCHAR(10) UNIQUE,             -- Mock _user_ref (U001 등). 시드 후 DROP 예정
  user_id           UUID UNIQUE,                    -- Auth 연결 시 app_user.id 매핑. FK는 추후 ALTER
  salon_id          UUID REFERENCES public.salon(id) ON DELETE SET NULL,
  bio               TEXT,
  highlight_message VARCHAR(200),
  years_of_exp      INT,
  rating_avg        DECIMAL(2,1) NOT NULL DEFAULT 0.0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  review_count      INT NOT NULL DEFAULT 0,
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  languages         VARCHAR(20)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(20)[],
  off_days          VARCHAR(10)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(10)[],
  other_links       JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- 시드 전용 임시 컬럼
  _temp_specialties          TEXT[],
  _temp_hair_type_experience TEXT[],

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_designer_salon     ON public.designer_profile (salon_id);
CREATE INDEX IF NOT EXISTS idx_designer_user      ON public.designer_profile (user_id);
CREATE INDEX IF NOT EXISTS idx_designer_languages ON public.designer_profile USING GIN (languages);

COMMENT ON COLUMN public.designer_profile.external_ref IS 'Mock _user_ref (U001). Auth 연결 후 DROP';
COMMENT ON COLUMN public.designer_profile.user_id      IS 'app_user.id와 1:1. Auth PDCA 시 NOT NULL + FK 제약 추가 예정';
COMMENT ON COLUMN public.designer_profile.salon_id     IS '소속 살롱. 프리랜서/이직 시 NULL';
COMMENT ON COLUMN public.designer_profile.languages    IS '구사 언어 slug 배열 (korean, english 등). FilterPopup Languages 섹션과 매칭';
COMMENT ON COLUMN public.designer_profile.off_days     IS 'MON, TUE 등 요일 코드 배열';
COMMENT ON COLUMN public.designer_profile.other_links  IS 'instagram/blog 등 외부 링크 JSONB';
COMMENT ON COLUMN public.designer_profile._temp_specialties          IS '시드용 임시. designer_keyword 시드 후 DROP';
COMMENT ON COLUMN public.designer_profile._temp_hair_type_experience IS '시드용 임시. designer_keyword 시드 후 DROP';
