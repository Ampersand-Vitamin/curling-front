-- Phase 1 — Keyword 마스터 (ERD §3.2 + 플랜 §2.3)
-- FilterPopup 9개 섹션의 마스터 데이터를 담는 테이블

-- ────────────────────────────────────────────────────
-- keyword_category: FilterPopup의 섹션 (Hair Type / Treatment / Style ...)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.keyword_category (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(50) NOT NULL,                -- "Hair Type", "Treatment" 등 (표시용)
  slug          VARCHAR(50) UNIQUE NOT NULL,         -- "hair_type", "treatment" 등 (코드용)
  display_order INT NOT NULL DEFAULT 0,              -- FilterPopup 내 표시 순서
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.keyword_category        IS 'FilterPopup 섹션 마스터';
COMMENT ON COLUMN public.keyword_category.slug   IS 'URL/코드용 식별자 (hair_type, treatment 등)';

-- ────────────────────────────────────────────────────
-- keyword: 각 카테고리 안의 실제 필터 칩
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.keyword (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES public.keyword_category(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,               -- "Curly Cut", "Afro-Textured Hair" 등
  slug          VARCHAR(100) NOT NULL,               -- "curly_cut", "afro_textured_hair" 등
  group_name    VARCHAR(30),                         -- Treatment 내부 2단계 그룹 (Cut/Color/Perm...). 미사용 시 NULL
  display_order INT NOT NULL DEFAULT 0,              -- 그룹/카테고리 내 표시 순서
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, slug)
);

COMMENT ON TABLE  public.keyword             IS 'FilterPopup 필터 칩 마스터';
COMMENT ON COLUMN public.keyword.group_name  IS '카테고리 내 2단계 그룹핑 (Treatment: Cut/Color/Perm 등). 그룹핑 불필요한 카테고리는 NULL';

-- ────────────────────────────────────────────────────
-- 인덱스
-- ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_keyword_category    ON public.keyword (category_id);
CREATE INDEX IF NOT EXISTS idx_keyword_group       ON public.keyword (group_name) WHERE group_name IS NOT NULL;
