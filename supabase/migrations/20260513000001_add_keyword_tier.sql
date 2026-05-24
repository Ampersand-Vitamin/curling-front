-- Add tier column to keyword (filter spec v3)
--   tier = 1: 기본 노출 (필터 팝업에 바로 표시)
--   tier = 2: "More" 토글 안에 숨김
--
-- Tier 분류는 사용자 제공 spec 기준.
-- service 카테고리는 group_name으로 구조가 분리되어 있어 tier 사용 안 함 (모두 1).

BEGIN;

ALTER TABLE public.keyword
  ADD COLUMN IF NOT EXISTS tier SMALLINT NOT NULL DEFAULT 1
  CHECK (tier IN (1, 2));

CREATE INDEX IF NOT EXISTS idx_keyword_category_tier_order
  ON public.keyword (category_id, tier, display_order);

-- ═══════════════════════════════════════════════════════════════════
-- Languages — Tier 2: Spanish, French, Vietnamese, Russian, Arabic
-- ═══════════════════════════════════════════════════════════════════
UPDATE public.keyword SET tier = 2
WHERE slug IN ('spanish', 'french', 'vietnamese', 'russian', 'arabic')
  AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'languages');

-- ═══════════════════════════════════════════════════════════════════
-- Specialty — Tier 2: Bridal/Men's/Children/Senior/Fine Hair/Damaged Hair
-- ═══════════════════════════════════════════════════════════════════
UPDATE public.keyword SET tier = 2
WHERE slug IN (
  'bridal_specialist',
  'mens_cut_specialist',
  'childrens_cut',
  'senior_friendly',
  'fine_hair_expert',
  'damaged_hair_repair'
)
  AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'specialty');

-- ═══════════════════════════════════════════════════════════════════
-- Amenities — Tier 2: Pet-friendly, Wheelchair, Kids, Same-day, Private Rooms
--   + english_speaking (스펙 외 키워드 — 데이터 보존하되 More 안으로 숨김)
-- ═══════════════════════════════════════════════════════════════════
UPDATE public.keyword SET tier = 2
WHERE slug IN (
  'pet_friendly',
  'wheelchair_access',
  'kids_welcome',
  'same_day_appointment',
  'private_room',
  'english_speaking'
)
  AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'amenities');

-- ═══════════════════════════════════════════════════════════════════
-- Inclusivity — Tier 2: Halal / LGBTQ / Hijab / Sustainable
-- ═══════════════════════════════════════════════════════════════════
UPDATE public.keyword SET tier = 2
WHERE slug IN (
  'halal_friendly',
  'lgbtq_friendly',
  'hijab_aware',
  'sustainable_eco'
)
  AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'inclusivity');

COMMIT;

-- 검증
-- SELECT kc.slug AS category, k.tier, COUNT(*)
-- FROM public.keyword k
-- JOIN public.keyword_category kc ON kc.id = k.category_id
-- WHERE kc.slug IN ('languages','specialty','service','amenities','inclusivity')
-- GROUP BY kc.slug, k.tier
-- ORDER BY kc.slug, k.tier;
