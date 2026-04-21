-- Phase 1 — designer_keyword 시드
--
-- 소스: designer_profile의 _temp_specialties / _temp_hair_type_experience 임시 컬럼
--
-- 로직:
--   1) _temp_specialties          → relation_type = 'specialty'
--      (Treatment / Style 카테고리 키워드와 name 매칭)
--   2) _temp_hair_type_experience → relation_type = 'experience'
--      (Hair Type 카테고리 키워드와 name 매칭)
--   3) 매칭 안 되는 값은 WARN 로그 (RAISE NOTICE) — 사전에 keyword 마스터에 있는지 확인 필수
--   4) 시드 완료 후 _temp 컬럼 DROP

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 1) specialty (장점) — _temp_specialties → designer_keyword
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.designer_keyword (designer_id, keyword_id, relation_type)
SELECT DISTINCT dp.id, k.id, 'specialty'
FROM public.designer_profile dp
CROSS JOIN LATERAL unnest(dp._temp_specialties) AS s(name)
JOIN public.keyword k ON k.name = s.name
ON CONFLICT (designer_id, keyword_id, relation_type) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 2) experience (경험) — _temp_hair_type_experience → designer_keyword
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.designer_keyword (designer_id, keyword_id, relation_type)
SELECT DISTINCT dp.id, k.id, 'experience'
FROM public.designer_profile dp
CROSS JOIN LATERAL unnest(dp._temp_hair_type_experience) AS h(name)
JOIN public.keyword k
  ON k.name = h.name
 AND k.category_id = (SELECT id FROM public.keyword_category WHERE slug = 'hair_type')
ON CONFLICT (designer_id, keyword_id, relation_type) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 3) 매칭 누락 검증 (데이터 소실 방지 가드)
--    하나라도 매칭 실패 시 EXCEPTION → 전체 트랜잭션 ROLLBACK
--    _temp 컬럼이 남아있어야 원인 파악 후 재시도 가능
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  missing_specialties  TEXT[];
  missing_hair_types   TEXT[];
  inserted_specialties INT;
  inserted_experiences INT;
BEGIN
  -- specialty 매칭 누락 명단 수집
  SELECT COALESCE(ARRAY_AGG(DISTINCT s.name ORDER BY s.name), ARRAY[]::TEXT[])
  INTO missing_specialties
  FROM public.designer_profile dp
  CROSS JOIN LATERAL unnest(dp._temp_specialties) AS s(name)
  WHERE NOT EXISTS (SELECT 1 FROM public.keyword k WHERE k.name = s.name);

  -- experience 매칭 누락 명단 수집
  SELECT COALESCE(ARRAY_AGG(DISTINCT h.name ORDER BY h.name), ARRAY[]::TEXT[])
  INTO missing_hair_types
  FROM public.designer_profile dp
  CROSS JOIN LATERAL unnest(dp._temp_hair_type_experience) AS h(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.keyword k
    JOIN public.keyword_category kc ON kc.id = k.category_id
    WHERE k.name = h.name AND kc.slug = 'hair_type'
  );

  -- 실제 INSERT 된 건수
  SELECT COUNT(*) INTO inserted_specialties
  FROM public.designer_keyword WHERE relation_type = 'specialty';
  SELECT COUNT(*) INTO inserted_experiences
  FROM public.designer_keyword WHERE relation_type = 'experience';

  -- 가드 1: 매칭 실패가 하나라도 있으면 중단
  IF array_length(missing_specialties, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'designer_keyword seed ABORTED: unmatched _specialties: %. Add to keyword master or normalize in 40_designers.sql, then re-run.', missing_specialties;
  END IF;

  IF array_length(missing_hair_types, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'designer_keyword seed ABORTED: unmatched _hair_type_experience: %. Add to keyword master (hair_type category) or fix data, then re-run.', missing_hair_types;
  END IF;

  -- 가드 2: 0건 INSERT면 비정상
  IF inserted_specialties = 0 OR inserted_experiences = 0 THEN
    RAISE EXCEPTION 'designer_keyword seed ABORTED: zero inserts (specialty=%, experience=%). Check designer_profile._temp_* columns and keyword master.',
      inserted_specialties, inserted_experiences;
  END IF;

  RAISE NOTICE 'designer_keyword seed OK: % specialty + % experience rows inserted.',
    inserted_specialties, inserted_experiences;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 4) salon.designer_count 재집계 (Mock number_of_designers를 실제 COUNT로 덮어씀)
-- ═══════════════════════════════════════════════════════════════════

UPDATE public.salon s
SET designer_count = sub.cnt
FROM (
  SELECT salon_id, COUNT(*) AS cnt
  FROM public.designer_profile
  WHERE salon_id IS NOT NULL
  GROUP BY salon_id
) sub
WHERE s.id = sub.salon_id;

-- 디자이너 없는 살롱은 0으로
UPDATE public.salon s
SET designer_count = 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.designer_profile dp WHERE dp.salon_id = s.id
);

-- ═══════════════════════════════════════════════════════════════════
-- 5) _temp 임시 컬럼 제거
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.designer_profile DROP COLUMN IF EXISTS _temp_specialties;
ALTER TABLE public.designer_profile DROP COLUMN IF EXISTS _temp_hair_type_experience;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- 검증 & 진단 쿼리
-- ═══════════════════════════════════════════════════════════════════
-- SELECT relation_type, COUNT(*) FROM public.designer_keyword GROUP BY relation_type;
--
-- 디자이너별 specialty/experience 수:
-- SELECT dp.external_ref,
--   SUM((dk.relation_type = 'specialty')::INT)  AS specialty_cnt,
--   SUM((dk.relation_type = 'experience')::INT) AS experience_cnt
-- FROM public.designer_profile dp
-- LEFT JOIN public.designer_keyword dk ON dk.designer_id = dp.id
-- GROUP BY dp.external_ref
-- ORDER BY dp.external_ref;
--
-- 키워드 인기 순위 (필터 분포 확인):
-- SELECT k.name, dk.relation_type, COUNT(*)
-- FROM public.designer_keyword dk
-- JOIN public.keyword k ON k.id = dk.keyword_id
-- GROUP BY k.name, dk.relation_type
-- ORDER BY COUNT(*) DESC;
--
-- 살롱별 제공 서비스 집계 (DesignerKeyword 합집합):
-- SELECT s.name, ARRAY_AGG(DISTINCT k.name ORDER BY k.name) AS services
-- FROM public.salon s
-- JOIN public.designer_profile dp ON dp.salon_id = s.id
-- JOIN public.designer_keyword dk ON dk.designer_id = dp.id
-- JOIN public.keyword k ON k.id = dk.keyword_id
-- WHERE dk.relation_type IN ('specialty', 'experience')
-- GROUP BY s.id, s.name
-- ORDER BY s.external_ref;
