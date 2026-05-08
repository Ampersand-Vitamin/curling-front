-- Phase 1 — DesignerKeyword N:M 조인 테이블
--
-- 핵심 설계:
--   relation_type로 "장점(specialty)" vs "경험(experience)" 구분
--   같은 키워드가 양쪽 역할로 중복 등록 가능 (composite PK에 relation_type 포함)
--
-- 소스 매핑:
--   designers.json._specialties[]          → relation_type = 'specialty'
--   designers.json._hair_type_experience[] → relation_type = 'experience'

CREATE TABLE IF NOT EXISTS public.designer_keyword (
  designer_id   UUID NOT NULL REFERENCES public.designer_profile(id) ON DELETE CASCADE,
  keyword_id    UUID NOT NULL REFERENCES public.keyword(id) ON DELETE CASCADE,
  relation_type VARCHAR(20) NOT NULL
                CHECK (relation_type IN ('specialty', 'experience')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (designer_id, keyword_id, relation_type)
);

-- 역방향 조회 (필터: "이 키워드를 가진 디자이너") 를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_designer_keyword_keyword   ON public.designer_keyword (keyword_id);
CREATE INDEX IF NOT EXISTS idx_designer_keyword_relation  ON public.designer_keyword (relation_type);

COMMENT ON COLUMN public.designer_keyword.relation_type IS
  'specialty: 디자이너가 자신 있는 영역 (장점 섹션)
   experience: 시술 경험이 있는 영역 (경험 섹션)';
