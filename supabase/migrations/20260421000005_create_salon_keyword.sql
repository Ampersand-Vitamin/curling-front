-- Phase 1 — SalonKeyword N:M 조인 테이블
--
-- 담는 대상 (살롱 차원의 속성만):
--   1. Facility/Policy: Pet Friendly, Private Room, Tax-free, Wheelchair Access, English-speaking, ...
--   2. Salon-level Service: Wedding Package, Couple Booking, Steam Care, Walk-in Welcome, ...
--
-- 담지 않는 대상:
--   디자이너 개인 시술 스킬 (Braids, Balayage 등)
--   → 살롱 제공 서비스는 "SalonKeyword ∪ 소속 디자이너들의 DesignerKeyword 합집합"으로 유도

CREATE TABLE IF NOT EXISTS public.salon_keyword (
  salon_id   UUID NOT NULL REFERENCES public.salon(id)   ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES public.keyword(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (salon_id, keyword_id)
);

CREATE INDEX IF NOT EXISTS idx_salon_keyword_keyword ON public.salon_keyword (keyword_id);
