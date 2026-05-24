-- Phase 1+ — Keyword 마스터 확장 (filter spec v2)
-- 소스: 사용자 제공 카테고리 스펙
--   Language / Specialty / Service / Amenities / Inclusivity
-- ※ Price Range, Location은 기획 논의 대기로 이번 시드에서 제외
--    Location은 칩 모델 외에 GPS / 반경 / 지도 폴리곤 등 별도 UI가 필요해 추후 처리
--
-- 핵심 결정:
--   - 기존 special_offers 카테고리는 완전히 제거.
--     슬러그/이름/구성이 모두 어색해서 amenities + inclusivity 두 카테고리로 재분배.
--   - 키워드 슬러그는 보존 → 60_salon_keywords.sql의 slug 기반 JOIN 깨지지 않음
--   - salon_keyword.keyword_id 매핑도 보존 → keyword.category_id만 UPDATE
--
-- 범위:
--   - 신규 카테고리 4개:
--       specialty, service, amenities, inclusivity
--   - special_offers 키워드 10개를 amenities(7)/inclusivity(3)로 마이그레이션
--   - special_offers 카테고리 DROP (이제 비어있음)
--   - languages 카테고리에 누락 키워드 2개 추가 (Vietnamese, Russian)
--   - tier / is_group_expander 컬럼은 미도입 (기획 논의 대기)
--     → Tier 1/2 구분, "More" 펼침은 추후 마이그레이션에서 처리
--   - owner 컬럼 미도입 → 카테고리별 의도된 소유자(designer/salon)는 주석으로만 기록
--
-- special_offers → 재분배 매핑:
--   AMENITIES (7):
--     english_speaking, by_appointment, walk_in_welcome,
--     private_room, pet_friendly, tax_free, wheelchair_access
--   INCLUSIVITY (3):
--     foreigner_friendly, vegan_products, pregnancy_safe
--
-- 중복/모호 처리:
--   - "Wigs & Extension" / "Wigs & Extensions" 표기 혼재 → "Wigs & Extensions"로 통일
--   - Head Spa는 Specialty와 Service 양쪽 카테고리에 의도적으로 양립 (다른 의미)
--   - Service의 "Perm (tier 2 open)" 같은 그룹 확장기 자체는 행으로 만들지 않음
--     → 하위 키워드의 group_name으로 그룹이 자연 형성됨 (기존 treatment 패턴 동일)
--
-- 의도된 소유자 (owner 컬럼 도입 전 가이드):
--   specialty   → designer
--   service     → designer
--   amenities   → salon
--   inclusivity → salon
--   languages   → designer

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 1) keyword_category — 신규 4개
--    display_order 100+ : 기존 카테고리(10~80, 90)와 충돌 방지
--    price_range, location은 기획 논의 후 별도 시드에서 추가 예정
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword_category (name, slug, display_order) VALUES
  ('Specialty',          'specialty',    100),
  ('Service',            'service',      110),
  ('Amenities',          'amenities',    140),
  ('Inclusivity',        'inclusivity',  150)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 2) Languages — 누락 2개 보충 (Vietnamese, Russian)
--    기존 시드 8개(Korean ~ Hindi, display_order 10~80) 뒤에 이어붙임
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, NULL, v.display_order
FROM public.keyword_category kc,
     (VALUES
        ('Vietnamese', 'vietnamese',  90),
        ('Russian',    'russian',    100)
     ) AS v(name, slug, display_order)
WHERE kc.slug = 'languages'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 3) Specialty (11개)
--    Tier 1 (5): Curly/Coily/K-pop/Highlight/Head Spa
--    Tier 2 (6): Bridal/Men's Cut/Children/Senior/Fine Hair/Damaged Hair
--    tier 컬럼 미도입 상태이므로 display_order로만 우선순위 표현
--      → 10~50 = Tier 1, 60~110 = Tier 2 (관례)
--    Head Spa는 Service에도 존재 (의도적 양립, slug로 구분: specialty_head_spa / service_head_spa)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, NULL, v.display_order
FROM public.keyword_category kc,
     (VALUES
        -- Tier 1
        ('Curly Hair Expert',     'curly_hair_expert',     10),
        ('Coily Hair Expert',     'coily_hair_expert',     20),
        ('K-pop Style',           'kpop_style',            30),
        ('Highlight Specialist',  'highlight_specialist',  40),
        ('Head Spa',              'specialty_head_spa',    50),
        -- Tier 2
        ('Bridal Specialist',     'bridal_specialist',     60),
        ('Men''s Cut Specialist', 'mens_cut_specialist',   70),
        ('Children''s Cut',       'childrens_cut',         80),
        ('Senior-friendly',       'senior_friendly',       90),
        ('Fine Hair Expert',      'fine_hair_expert',     100),
        ('Damaged Hair Repair',   'damaged_hair_repair',  110)
     ) AS v(name, slug, display_order)
WHERE kc.slug = 'specialty'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 4) Service (23개)
--    구조:
--      Top-level (group_name = NULL): Haircut / Coloring / Highlight / Head Spa
--      Group 'Perm':                7개
--      Group 'Straightening':       4개
--      Group 'Protective Styles':   5개
--      Group 'Wigs & Extensions':   3개
--    "Perm (tier 2 open)" 같은 그룹 확장기 자체는 행으로 만들지 않음
--      → ServiceGroupSection이 group_name으로 그룹 칩을 자동 생성 (기존 treatment 패턴)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, v.group_name, v.display_order
FROM public.keyword_category kc,
     (VALUES
        -- Top-level (group_name NULL)
        ('Haircut',                  'service_haircut',          NULL,                  10),
        ('Coloring',                 'service_coloring',         NULL,                  20),
        ('Highlight',                'service_highlight',        NULL,                  30),
        ('Head Spa',                 'service_head_spa',         NULL,                  40),
        -- Perm
        ('S Curl Perm',              's_curl_perm',              'Perm',               100),
        ('C Curl Perm',              'c_curl_perm',              'Perm',               110),
        ('CS Curl Perm',             'cs_curl_perm',             'Perm',               120),
        ('Cloud Perm',               'cloud_perm',               'Perm',               130),
        ('Slick Perm',               'slick_perm',               'Perm',               140),
        ('Grace Perm',               'grace_perm',               'Perm',               150),
        ('Hippie Perm',              'hippie_perm',              'Perm',               160),
        -- Straightening
        ('Magic Straightening',      'magic_straightening',      'Straightening',      200),
        ('Japanese Straightening',   'japanese_straightening',   'Straightening',      210),
        ('Keratin Treatment',        'service_keratin_treatment','Straightening',      220),
        ('Brazilian Blowout',        'brazilian_blowout',        'Straightening',      230),
        -- Protective Styles
        ('Box Braids',               'box_braids',               'Protective Styles',  300),
        ('Knotless Braids',          'knotless_braids',          'Protective Styles',  310),
        ('Cornrows',                 'cornrows',                 'Protective Styles',  320),
        ('Two-Strand Twists',        'two_strand_twists',        'Protective Styles',  330),
        ('Faux Locs',                'faux_locs',                'Protective Styles',  340),
        -- Wigs & Extensions
        ('Lace Front Wig',           'lace_front_wig',           'Wigs & Extensions',  400),
        ('Sew-In Weave',             'sew_in_weave',             'Wigs & Extensions',  410),
        ('Closure Wig',              'closure_wig',              'Wigs & Extensions',  420)
     ) AS v(name, slug, group_name, display_order)
WHERE kc.slug = 'service'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 5) special_offers → amenities/inclusivity 마이그레이션
--    keyword_id 보존 → salon_keyword 매핑 무손실
-- ═══════════════════════════════════════════════════════════════════

-- 5-a) 시설/서비스성 7개 → amenities
UPDATE public.keyword
SET category_id = (SELECT id FROM public.keyword_category WHERE slug = 'amenities')
WHERE slug IN (
  'english_speaking',
  'by_appointment',
  'walk_in_welcome',
  'private_room',
  'pet_friendly',
  'tax_free',
  'wheelchair_access'
)
  AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'special_offers');

-- 5-b) 가치/정체성 3개 → inclusivity
UPDATE public.keyword
SET category_id = (SELECT id FROM public.keyword_category WHERE slug = 'inclusivity')
WHERE slug IN (
  'foreigner_friendly',
  'vegan_products',
  'pregnancy_safe'
)
  AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'special_offers');

-- ═══════════════════════════════════════════════════════════════════
-- 6) Amenities — 신규 키워드 7개 추가 (스펙 - 기존 마이그레이션분)
--    기존 마이그레이션 7개 display_order 재정렬:
--      Tier 1 (10~50): Free Parking / Wi-Fi / Free Drinks / Card Payment / English Menu (모두 신규)
--      Tier 2 (60~):   Pet Friendly / Wheelchair / Kids Welcome / Same-day / Private Room
--                       (Pet/Wheelchair/Private는 마이그레이션, Kids/Same-day는 신규)
--      그 외 기존(스펙 외): English-speaking / By Appointment / Walk-in Welcome / Tax-free
--                       (보존 — 데이터/매핑이 있어 제거 시 손실)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, NULL, v.display_order
FROM public.keyword_category kc,
     (VALUES
        ('Free Parking',         'free_parking',         10),
        ('Wi-Fi',                'wifi',                 20),
        ('Free Drinks/Snacks',   'free_drinks_snacks',   30),
        ('Card Payment',         'card_payment',         40),
        ('English Menu/Sign',    'english_menu',         50),
        ('Kids Welcome',         'kids_welcome',         80),
        ('Same-day Appointment', 'same_day_appointment', 90)
     ) AS v(name, slug, display_order)
WHERE kc.slug = 'amenities'
ON CONFLICT (category_id, slug) DO NOTHING;

-- 마이그레이션된 7개의 display_order 재배치 (스펙 우선순위 반영)
UPDATE public.keyword SET display_order =  60 WHERE slug = 'pet_friendly'      AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'amenities');
UPDATE public.keyword SET display_order =  70 WHERE slug = 'wheelchair_access' AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'amenities');
UPDATE public.keyword SET display_order = 100 WHERE slug = 'private_room'      AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'amenities');
-- 스펙 외 보존 항목 (Tier 2 후순위)
UPDATE public.keyword SET display_order = 110 WHERE slug = 'english_speaking'  AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'amenities');
UPDATE public.keyword SET display_order = 120 WHERE slug = 'by_appointment'    AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'amenities');
UPDATE public.keyword SET display_order = 130 WHERE slug = 'walk_in_welcome'   AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'amenities');
UPDATE public.keyword SET display_order = 140 WHERE slug = 'tax_free'          AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'amenities');

-- ═══════════════════════════════════════════════════════════════════
-- 7) Inclusivity — 신규 키워드 5개 추가 (스펙 - 기존 마이그레이션분)
--    기존 마이그레이션 3개 display_order 재정렬:
--      Tier 1 (10~30): Foreigner-friendly / Vegan / Cruelty-free
--                       (Foreigner/Vegan은 마이그레이션, Cruelty-free 신규)
--      Tier 2 (40~):   Halal / LGBTQ+ / Hijab / Sustainable / Pregnancy-safe
--                       (Halal/LGBTQ/Hijab/Sustainable 신규, Pregnancy-safe 마이그레이션)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, NULL, v.display_order
FROM public.keyword_category kc,
     (VALUES
        ('Cruelty-free Products',      'cruelty_free',     30),
        ('Halal-friendly',             'halal_friendly',   40),
        ('LGBTQ+ Friendly',            'lgbtq_friendly',   50),
        ('Hijab-aware Service',        'hijab_aware',      60),
        ('Sustainable / Eco-conscious','sustainable_eco',  70)
     ) AS v(name, slug, display_order)
WHERE kc.slug = 'inclusivity'
ON CONFLICT (category_id, slug) DO NOTHING;

-- 마이그레이션된 3개의 display_order 재배치
UPDATE public.keyword SET display_order = 10 WHERE slug = 'foreigner_friendly' AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'inclusivity');
UPDATE public.keyword SET display_order = 20 WHERE slug = 'vegan_products'     AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'inclusivity');
UPDATE public.keyword SET display_order = 80 WHERE slug = 'pregnancy_safe'     AND category_id = (SELECT id FROM public.keyword_category WHERE slug = 'inclusivity');

-- ═══════════════════════════════════════════════════════════════════
-- 8) special_offers 카테고리 제거
--    이 시점에 keyword 0개 (모두 amenities/inclusivity로 이동)
--    안전장치: 키워드가 남아있으면 RAISE 발생시켜 데이터 손실 방지
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  remaining_count INT;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM public.keyword k
  JOIN public.keyword_category kc ON kc.id = k.category_id
  WHERE kc.slug = 'special_offers';

  IF remaining_count > 0 THEN
    RAISE EXCEPTION 'special_offers still has % keyword(s) — migration incomplete', remaining_count;
  END IF;
END $$;

DELETE FROM public.keyword_category WHERE slug = 'special_offers';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- 검증 쿼리
-- ═══════════════════════════════════════════════════════════════════
-- SELECT COUNT(*) FROM public.keyword_category;
-- -- 기존 9 - 1(special_offers) + 4(specialty/service/amenities/inclusivity) = 12
--
-- SELECT COUNT(*) FROM public.keyword;
-- -- 기존 54 + 2(lang) + 11(specialty) + 23(service) + 7(amenities new) + 5(inclusivity new) = 102
--
-- SELECT kc.slug AS category, COUNT(k.id) AS keyword_count
-- FROM public.keyword_category kc
-- LEFT JOIN public.keyword k ON k.category_id = kc.id
-- GROUP BY kc.slug, kc.display_order
-- ORDER BY kc.display_order;
-- -- Expected:
-- --   hair_type         : 13
-- --   treatment         : 21
-- --   style             :  2
-- --   hair_concern      :  0
-- --   languages         : 10  (+2)
-- --   hair_color        :  0
-- --   hair_length       :  0
-- --   treatment_history :  0
-- --   specialty         : 11  (NEW)
-- --   service           : 23  (NEW)
-- --   amenities         : 14  (NEW: 7 migrated + 7 added)
-- --   inclusivity       :  8  (NEW: 3 migrated + 5 added)
-- --   special_offers    : (없음 — 카테고리 자체 제거)
--
-- -- amenities/inclusivity 정렬 확인
-- SELECT k.display_order, k.name, k.slug
-- FROM public.keyword k
-- JOIN public.keyword_category kc ON kc.id = k.category_id
-- WHERE kc.slug IN ('amenities', 'inclusivity')
-- ORDER BY kc.slug, k.display_order;
--
-- -- salon_keyword 매핑 보존 확인
-- SELECT k.slug, kc.slug AS category, COUNT(*) AS salon_links
-- FROM public.salon_keyword sk
-- JOIN public.keyword k ON k.id = sk.keyword_id
-- JOIN public.keyword_category kc ON kc.id = k.category_id
-- WHERE k.slug IN ('english_speaking', 'walk_in_welcome', 'by_appointment', 'private_room')
-- GROUP BY k.slug, kc.slug;
-- -- Expected: category = 'amenities' (special_offers 아님)
