-- Phase 1 — salon_keyword 시드 (Facility/Policy + Salon-level Service)
--
-- 역할:
--   1) keyword_category 'special_offers' 안에 Facility 키워드 마스터 시드
--   2) 각 살롱에 해당 키워드 매핑
--
-- 매핑 전략:
--   (a) 자동 — salon.languages, salon.introduction 텍스트로부터 유추
--   (b) 수동 — 나머지는 운영 중 admin 태깅 (TODO)

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 1) Facility 키워드 마스터 확장 (special_offers 카테고리)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, 'Facility', v.display_order
FROM public.keyword_category kc,
     (VALUES
        ('English-speaking',   'english_speaking',  10),
        ('By Appointment',     'by_appointment',    20),
        ('Walk-in Welcome',    'walk_in_welcome',   30),
        ('Private Room',       'private_room',      40),
        ('Pet Friendly',       'pet_friendly',      50),
        ('Tax-free',           'tax_free',          60),
        ('Wheelchair Access',  'wheelchair_access', 70)
     ) AS v(name, slug, display_order)
WHERE kc.slug = 'special_offers'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 2) 자동 매핑 (a) — salon.languages에서 파생
--    'english' ∈ languages → English-speaking
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.salon_keyword (salon_id, keyword_id)
SELECT s.id, k.id
FROM public.salon s, public.keyword k
WHERE 'english' = ANY(s.languages)
  AND k.slug = 'english_speaking'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 3) 자동 매핑 (b) — introduction 텍스트 키워드 매칭
-- ═══════════════════════════════════════════════════════════════════

-- "Walk-ins welcome" → Walk-in Welcome
INSERT INTO public.salon_keyword (salon_id, keyword_id)
SELECT s.id, k.id
FROM public.salon s, public.keyword k
WHERE s.introduction ILIKE '%walk-in%'
  AND k.slug = 'walk_in_welcome'
ON CONFLICT DO NOTHING;

-- "By appointment only" → By Appointment
INSERT INTO public.salon_keyword (salon_id, keyword_id)
SELECT s.id, k.id
FROM public.salon s, public.keyword k
WHERE s.introduction ILIKE '%by appointment%'
  AND k.slug = 'by_appointment'
ON CONFLICT DO NOTHING;

-- "quiet, private space" → Private Room
INSERT INTO public.salon_keyword (salon_id, keyword_id)
SELECT s.id, k.id
FROM public.salon s, public.keyword k
WHERE s.introduction ILIKE '%private%'
  AND k.slug = 'private_room'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 4) 수동 매핑 (TODO) — 데이터로부터 유추 불가능한 항목
-- ═══════════════════════════════════════════════════════════════════
--
-- Pet Friendly:       운영 중 살롱 인터뷰/사진 검수로 태깅
-- Tax-free:           외국인 관광객 세금 환급 등록 살롱만 — 별도 확인 필요
-- Wheelchair Access:  오프라인 현장 확인 필수
--
-- 예시 (운영 시 활성화):
-- INSERT INTO public.salon_keyword (salon_id, keyword_id)
-- SELECT s.id, k.id
-- FROM public.salon s, public.keyword k
-- WHERE s.external_ref IN ('S004', 'S015', 'S028')  -- Specialty 살롱 일부
--   AND k.slug = 'pet_friendly'
-- ON CONFLICT DO NOTHING;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- 검증 쿼리
-- ═══════════════════════════════════════════════════════════════════
-- SELECT k.name AS facility, COUNT(*) AS salon_count
-- FROM public.salon_keyword sk
-- JOIN public.keyword k ON k.id = sk.keyword_id
-- JOIN public.keyword_category kc ON kc.id = k.category_id
-- WHERE kc.slug = 'special_offers'
-- GROUP BY k.name
-- ORDER BY COUNT(*) DESC;
--
-- 살롱별 Facility 목록:
-- SELECT s.name, ARRAY_AGG(k.name ORDER BY k.display_order) AS facilities
-- FROM public.salon s
-- LEFT JOIN public.salon_keyword sk ON sk.salon_id = s.id
-- LEFT JOIN public.keyword k ON k.id = sk.keyword_id
-- GROUP BY s.id, s.name
-- ORDER BY s.external_ref;
