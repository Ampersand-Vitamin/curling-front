-- Phase 1 — Keyword 마스터 시드
-- 소스: Downloads/designers.json (150명) + filter-popup-redesign PDCA
--
-- 범위:
--   keyword_category 9개 전체 생성
--   keyword 시드 51개:
--     - Treatment:     21 (Cut/Color/Perm/Braids&Locs/Care/Barber)
--     - Style:          2
--     - Hair Type:     13
--     - Languages:      8
--     - Special Offers: 7 (Salon Features — filter-popup-redesign)
--
--   hair_concern / hair_color / hair_length / treatment_history
--   카테고리는 생성만, keyword 시드는 추후 PDCA(My 탭 Hair Profile)에서 진행

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 1) keyword_category (9개)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword_category (name, slug, display_order) VALUES
  ('Hair Type',           'hair_type',          10),
  ('Treatment',           'treatment',          20),
  ('Style',               'style',              30),
  ('Hair Concern',        'hair_concern',       40),
  ('Languages',           'languages',          50),
  ('Special Offers',      'special_offers',     60),
  ('Current Hair Color',  'hair_color',         70),
  ('Current Hair Length', 'hair_length',        80),
  ('Treatment History',   'treatment_history',  90)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 2) keyword — Treatment 카테고리 (21개)
--    소스: _specialties 중 시술 성격의 값
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, v.group_name, v.display_order
FROM public.keyword_category kc,
     (VALUES
        -- Cut
        ('Afro Cut',          'afro_cut',          'Cut',            10),
        ('Big Chop',          'big_chop',          'Cut',            20),
        ('Curly Cut',         'curly_cut',         'Cut',            30),
        ('Layered Cut',       'layered_cut',       'Cut',            40),
        ('Undercut',          'undercut',          'Cut',            50),
        -- Color
        ('Balayage',          'balayage',          'Color',          60),
        ('Bleach & Tone',     'bleach_and_tone',   'Color',          70),
        ('Hair Coloring',     'hair_coloring',     'Color',          80),
        ('Highlights',        'highlights',        'Color',          90),
        -- Perm
        ('Digital Perm',      'digital_perm',      'Perm',          100),
        ('Keratin Treatment', 'keratin_treatment', 'Perm',          110),
        ('Korean Perm',       'korean_perm',       'Perm',          120),
        -- Braids & Locs
        ('Braids',            'braids',            'Braids & Locs', 130),
        ('Hair Extensions',   'hair_extensions',   'Braids & Locs', 140),
        ('Locs',              'locs',              'Braids & Locs', 150),
        ('Protective Styles', 'protective_styles', 'Braids & Locs', 160),
        -- Care
        ('Coily Hair Care',   'coily_hair_care',   'Care',          170),
        ('Head Spa',          'head_spa',          'Care',          180),
        ('Scalp Treatment',   'scalp_treatment',   'Care',          190),
        -- Barber
        ('Fade',              'fade',              'Barber',        200),
        ('Taper',             'taper',             'Barber',        210)
     ) AS v(name, slug, group_name, display_order)
WHERE kc.slug = 'treatment'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 3) keyword — Style 카테고리 (2개)
--    소스: _specialties 중 "스타일링 기법" 성격의 값
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, NULL, v.display_order
FROM public.keyword_category kc,
     (VALUES
        ('Curl Definition',      'curl_definition',      10),
        ('Natural Hair Styling', 'natural_hair_styling', 20)
     ) AS v(name, slug, display_order)
WHERE kc.slug = 'style'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 4) keyword — Hair Type 카테고리 (13개)
--    소스: _hair_type_experience
--    순서: Straight → Wavy → Curly → Coily → Afro 흐름 + 특수 타입 후순위
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, NULL, v.display_order
FROM public.keyword_category kc,
     (VALUES
        ('Straight Hair',         'straight_hair',          10),
        ('Wavy Hair (2a-2c)',     'wavy_hair_2a_2c',        20),
        ('Curly Hair (3a-3c)',    'curly_hair_3a_3c',       30),
        ('Coily Hair (4a-4c)',    'coily_hair_4a_4c',       40),
        ('Afro-Textured Hair',    'afro_textured_hair',     50),
        ('Fine Hair',             'fine_hair',              60),
        ('Thick/Coarse Hair',     'thick_coarse_hair',      70),
        ('Mixed Texture Hair',    'mixed_texture_hair',     80),
        ('Natural Hair',          'natural_hair',           90),
        ('Color-Treated Hair',    'color_treated_hair',    100),
        ('Bleached/Damaged Hair', 'bleached_damaged_hair', 110),
        ('Asian Hair',            'asian_hair',            120),
        ('European Hair',         'european_hair',         130)
     ) AS v(name, slug, display_order)
WHERE kc.slug = 'hair_type'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 5) keyword — Languages 카테고리 (8개)
--    소스: designer.languages
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, NULL, v.display_order
FROM public.keyword_category kc,
     (VALUES
        ('Korean',    'korean',   10),
        ('English',   'english',  20),
        ('Japanese',  'japanese', 30),
        ('Chinese',   'chinese',  40),
        ('French',    'french',   50),
        ('Spanish',   'spanish',  60),
        ('Arabic',    'arabic',   70),
        ('Hindi',     'hindi',    80)
     ) AS v(name, slug, display_order)
WHERE kc.slug = 'languages'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 6) keyword — Special Offers 카테고리 (Salon Features, 7개)
--    소스: filter-design-discussion.html §7 "Salon Features"
--    Plan FR-08 / Design §4.9
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, NULL, v.display_order
FROM public.keyword_category kc,
     (VALUES
        ('Foreigner Friendly', 'foreigner_friendly', 10),
        ('English-speaking',   'english_speaking',   20),
        ('Private Room',       'private_room',       30),
        ('Pet Friendly',       'pet_friendly',       40),
        ('Tax-free',           'tax_free',           50),
        ('Pregnancy-safe',     'pregnancy_safe',     60),
        ('Vegan Products',     'vegan_products',     70)
     ) AS v(name, slug, display_order)
WHERE kc.slug = 'special_offers'
ON CONFLICT (category_id, slug) DO NOTHING;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- 검증 쿼리
-- ═══════════════════════════════════════════════════════════════════
-- SELECT COUNT(*) FROM public.keyword_category;                          -- 9
-- SELECT COUNT(*) FROM public.keyword;                                   -- 51
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
-- --   languages         :  8
-- --   special_offers    :  7   ← filter-popup-redesign
-- --   hair_color        :  0
-- --   hair_length       :  0
-- --   treatment_history :  0
--
-- SELECT group_name, COUNT(*) FROM public.keyword
-- WHERE category_id = (SELECT id FROM public.keyword_category WHERE slug = 'treatment')
-- GROUP BY group_name ORDER BY MIN(display_order);
-- -- Expected:
-- --   Cut            : 5
-- --   Color          : 4
-- --   Perm           : 3
-- --   Braids & Locs  : 4
-- --   Care           : 3
-- --   Barber         : 2
