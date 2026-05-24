-- ============================================
-- Step 1: hair_profiles 테이블 생성 (최초 실행 시)
-- Supabase Dashboard → SQL Editor에서 실행
-- ============================================

create table if not exists public.hair_profiles (
  id uuid not null default gen_random_uuid(),
  user_id text not null unique,       -- OAuth provider sub (Google/Kakao user ID)
  account_mode text,                  -- 'client' | 'designer'
  name text,
  gender text,
  hair_type text,
  hair_length text,
  hair_concerns text[],
  hair_history text[],
  languages text[],
  preferred_styles text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_hair_profiles primary key (id)
);

alter table public.hair_profiles enable row level security;

-- Service role bypasses RLS (used by server API routes)
create policy "Service role can do all"
  on public.hair_profiles for all
  using (true)
  with check (true);

-- ============================================
-- Step 2: 기존 테이블의 user_id 타입 변경
-- (uuid → text, 이미 테이블이 있는 경우만 실행)
-- ============================================

-- alter table public.hair_profiles
--   alter column user_id type text using user_id::text;

-- ============================================
-- Step 3: 프로필 전용 컬럼 추가
-- (온보딩에서는 수집하지 않고 프로필 설정에서만 편집)
-- ============================================

alter table public.hair_profiles
  add column if not exists bio text,
  add column if not exists age text,
  add column if not exists hair_color text;

-- ============================================
-- Step 4: 아바타 + 프로필 전용 컬럼 추가
-- ============================================

alter table public.hair_profiles
  add column if not exists avatar_url text;

create or replace function update_avatar_url(p_user_id text, p_avatar_url text)
returns void language sql security definer as $$
  update public.hair_profiles
  set avatar_url = p_avatar_url, updated_at = now()
  where user_id = p_user_id;
$$;

-- ============================================
-- Step 5: RPC 함수 — PostgREST 캐시 우회용
-- (테이블을 직접 쿼리하지 않고 함수로 접근)
-- ============================================

-- upsert: 온보딩 + 프로필 편집 공용
-- bio/age/hair_color는 DEFAULT NULL → 온보딩 시 기존 값 보존 (COALESCE)
create or replace function upsert_hair_profile(
  p_user_id        text,
  p_account_mode   text,
  p_name           text,
  p_gender         text,
  p_hair_type      text,
  p_hair_length    text,
  p_hair_concerns  text[],
  p_hair_history   text[],
  p_languages      text[],
  p_preferred_styles text[],
  p_bio            text default null,
  p_age            text default null,
  p_hair_color     text default null
) returns void language plpgsql security definer as $$
begin
  insert into public.hair_profiles (
    user_id, account_mode, name, gender, hair_type, hair_length,
    hair_concerns, hair_history, languages, preferred_styles,
    bio, age, hair_color, updated_at
  ) values (
    p_user_id, p_account_mode, p_name, p_gender, p_hair_type, p_hair_length,
    p_hair_concerns, p_hair_history, p_languages, p_preferred_styles,
    p_bio, p_age, p_hair_color, now()
  )
  on conflict (user_id) do update set
    account_mode     = excluded.account_mode,
    name             = excluded.name,
    gender           = excluded.gender,
    hair_type        = excluded.hair_type,
    hair_length      = excluded.hair_length,
    hair_concerns    = excluded.hair_concerns,
    hair_history     = excluded.hair_history,
    languages        = excluded.languages,
    preferred_styles = excluded.preferred_styles,
    -- 온보딩(NULL 전달)이면 기존 값 유지, 프로필 편집이면 새 값으로 덮어씀
    bio        = coalesce(excluded.bio,        hair_profiles.bio),
    age        = coalesce(excluded.age,        hair_profiles.age),
    hair_color = coalesce(excluded.hair_color, hair_profiles.hair_color),
    updated_at = now();
end; $$;

-- get: 단일 행 반환
create or replace function get_hair_profile(p_user_id text)
returns setof public.hair_profiles language sql security definer as $$
  select * from public.hair_profiles where user_id = p_user_id limit 1;
$$;
