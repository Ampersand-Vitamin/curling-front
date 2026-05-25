-- ============================================================
-- Curling — Supabase Migration (단일 실행본)
-- Supabase Dashboard → SQL Editor에 전체 붙여넣고 Run
-- ============================================================

-- 1. onboarding_profiles 테이블
create table if not exists public.onboarding_profiles (
  id               uuid        not null default gen_random_uuid(),
  user_id          text        not null unique,
  account_mode     text,
  name             text,
  gender           text,
  hair_type        text,
  hair_length      text,
  hair_concerns    text[],
  hair_history     text[],
  languages        text[],
  preferred_styles text[],
  bio              text,
  age              text,
  hair_color       text,
  avatar_url       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint pk_onboarding_profiles primary key (id)
);

-- 2. RLS 활성화
alter table public.onboarding_profiles enable row level security;

-- 3. RLS 정책
-- service_role은 RLS 자체를 우회하므로 별도 정책 불필요
-- 아래는 authenticated 유저가 자신의 row만 읽을 수 있는 정책
create policy "Users can view own profile"
  on public.onboarding_profiles for select
  using (user_id = auth.uid()::text);

-- 4. 권한 부여
grant select, insert, update, delete
  on public.onboarding_profiles
  to anon, authenticated, service_role;

-- 5. PostgREST 스키마 캐시 갱신
notify pgrst, 'reload schema';
