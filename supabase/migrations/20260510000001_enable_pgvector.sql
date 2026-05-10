-- Phase 3 — pgvector 확장 활성화 (Style 탭 자연어 검색용)
-- Supabase 모든 tier에서 지원. 대시보드의 Database → Extensions 에서 미리 enable 했어도 idempotent.

CREATE EXTENSION IF NOT EXISTS vector;
