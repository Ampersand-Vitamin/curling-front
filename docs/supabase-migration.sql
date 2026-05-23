-- ============================================
-- NextAuth v5 + Supabase Adapter 필수 테이블
-- Supabase Dashboard → SQL Editor에서 실행
-- ============================================

create schema if not exists next_auth;

grant usage on schema next_auth to service_role;
grant all on all tables in schema next_auth to service_role;
grant all on all sequences in schema next_auth to service_role;
grant all on all routines in schema next_auth to service_role;

create table if not exists next_auth.users (
  id uuid not null default uuid_generate_v4(),
  name text,
  email text,
  "emailVerified" timestamptz,
  image text,
  constraint pk_users primary key (id)
);

create unique index if not exists users_email_idx on next_auth.users (email);

create table if not exists next_auth.accounts (
  id uuid not null default uuid_generate_v4(),
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  "userId" uuid,
  constraint pk_accounts primary key (id),
  constraint fk_user foreign key ("userId") references next_auth.users (id) on delete cascade
);

create unique index if not exists accounts_provider_idx
  on next_auth.accounts (provider, "providerAccountId");

create table if not exists next_auth.sessions (
  id uuid not null default uuid_generate_v4(),
  "sessionToken" text not null,
  "userId" uuid,
  expires timestamptz not null,
  constraint pk_sessions primary key (id),
  constraint fk_user foreign key ("userId") references next_auth.users (id) on delete cascade
);

create unique index if not exists sessions_token_idx on next_auth.sessions ("sessionToken");

create table if not exists next_auth.verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  constraint pk_verification_tokens primary key (identifier, token)
);

-- ============================================
-- 온보딩 프로필 테이블
-- ============================================

create table if not exists public.hair_profiles (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null unique,
  account_mode text,              -- 'client' | 'designer'
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

-- RLS: 본인 데이터만 조회/수정 가능
alter table public.hair_profiles enable row level security;

create policy "Users can view own profile"
  on public.hair_profiles for select
  using (auth.uid()::text = user_id::text);

create policy "Service role can do all"
  on public.hair_profiles for all
  using (true)
  with check (true);
