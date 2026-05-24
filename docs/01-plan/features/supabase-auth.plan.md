# supabase-auth Planning Document

> **Summary**: NextAuth(JWT-only) → Supabase Auth로 인증 체계를 전환하여, Supabase RLS를 활용한 보안 쿼리 구조로 통일한다. Google/Kakao OAuth는 그대로 유지하며, `supabaseAdmin` 의존을 유저 쿼리에서 제거한다.
>
> **Project**: curling-front
> **Version**: 0.1.0
> **Author**: syk
> **Date**: 2026-05-24
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | NextAuth와 Supabase가 별개 시스템이라 인증된 유저 쿼리에도 `supabaseAdmin`(service role)으로 RLS를 우회해야 한다. 보안 레이어가 빠지고 실수로 타 유저 데이터 접근 가능성이 있다. |
| **Solution** | NextAuth 제거 → Supabase Auth(`@supabase/ssr`) 도입. Google/Kakao OAuth를 Supabase provider로 설정하고, 서버 컴포넌트/API Route에서 유저 세션 기반 Supabase 클라이언트를 사용한다. |
| **Function/UX Effect** | 로그인/로그아웃 UX 동일 유지. 리디렉트 플로우 동일 (로그인 → 프로필 확인 → discover/onboarding 분기). 유저 체감 변화 없음. |
| **Core Value** | 인증과 DB가 하나의 시스템으로 통일되어 RLS 기반 보안 쿼리 가능. `supabaseAdmin` 의존 제거로 보안 강화 및 코드 단순화. |

---

## Context Anchor

> Auto-generated from Executive Summary. Propagated to Design/Do documents for context continuity.

| Key | Value |
|-----|-------|
| **WHY** | NextAuth + supabaseAdmin 조합은 인증/DB 분리로 RLS 무력화. 보안 레이어 부재 및 코드 복잡도 증가. |
| **WHO** | 모든 로그인 유저 (Google/Kakao OAuth) |
| **RISK** | (1) Supabase 대시보드 OAuth 설정 실수 시 로그인 불가 (2) 기존 `user_id`(OAuth sub) → Supabase Auth UUID 불일치 (3) 쿠키 기반 세션 전환 시 middleware 오동작 |
| **SUCCESS** | (1) supabaseAdmin이 유저 쿼리에서 0회 사용 (2) RLS policy가 모든 유저 테이블에 적용 (3) 로그인/로그아웃/리디렉트 플로우 정상 동작 (4) 기존 기능 회귀 없음 |
| **SCOPE** | 인증 체계 전환만. UI 변경 없음. 신규 기능 추가 없음. |

---

## 1. Requirements

### 1.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Supabase Auth로 Google OAuth 로그인/로그아웃 | Must |
| FR-02 | Supabase Auth로 Kakao OAuth 로그인/로그아웃 | Must |
| FR-03 | 서버 컴포넌트에서 Supabase 유저 세션 기반 쿼리 (RLS 활용) | Must |
| FR-04 | API Route에서 Supabase 유저 세션 기반 쿼리 | Must |
| FR-05 | 로그인 → /auth/redirect → 프로필 여부에 따라 /discover or /onboarding 분기 | Must |
| FR-06 | middleware에서 인증 상태 기반 라우트 보호 | Must |
| FR-07 | `supabaseAdmin`은 Storage 업로드 등 서버 전용 작업에만 사용 | Should |
| FR-08 | "Browse without Account" 비로그인 접근 유지 | Must |

### 1.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | 유저 체감 로그인 플로우 변화 없음 |
| NFR-02 | `hair_profiles` 테이블에 RLS policy 적용 |
| NFR-03 | NextAuth 관련 패키지 완전 제거 (`next-auth`, `@auth/*`) |

---

## 2. Scope

### 2.1 In Scope

- NextAuth 제거 및 Supabase Auth 도입
- `@supabase/ssr` 기반 서버/클라이언트 Supabase 클라이언트 구성
- middleware 재작성 (Supabase 세션 체크)
- 모든 `auth()` 호출을 Supabase `getUser()` 로 교체
- 유저 쿼리에서 `supabaseAdmin` → 유저 클라이언트로 전환
- Supabase 대시보드 OAuth provider 설정 가이드

### 2.2 Out of Scope

- UI/디자인 변경
- 신규 기능 추가
- 기존 데이터 마이그레이션 (신규 시작)
- Email 로그인 구현 (현재 placeholder 버튼만 존재)

---

## 3. Technical Approach

### 3.1 패키지 변경

| Action | Package |
|--------|---------|
| **추가** | `@supabase/ssr` |
| **제거** | `next-auth` |

### 3.2 파일 변경 맵

| 파일 | 변경 내용 |
|------|----------|
| `src/lib/supabase.ts` | 서버/클라이언트 Supabase 클라이언트 재구성 (`@supabase/ssr` 활용) |
| `src/lib/auth/index.ts` | 삭제 (NextAuth 설정) |
| `src/app/api/auth/[...nextauth]/route.ts` | 삭제 → `src/app/auth/callback/route.ts` (Supabase OAuth callback) |
| `src/app/page.tsx` | `signIn("google")` → `supabase.auth.signInWithOAuth()` |
| `src/app/(main)/my/AccountActions.tsx` | `signOut()` → `supabase.auth.signOut()` |
| `src/middleware.ts` | NextAuth `auth()` → Supabase `getUser()` 기반 세션 체크 |
| `src/app/(main)/layout.tsx` | `auth()` → Supabase server client `getUser()` |
| `src/app/(main)/my/page.tsx` | `supabaseAdmin` → Supabase server client (RLS) |
| `src/app/(main)/my/edit/page.tsx` | 동일 |
| `src/app/auth/redirect/route.ts` | 동일 |
| `src/app/api/onboarding/route.ts` | 동일 |
| `src/app/api/profile/avatar/route.ts` | DB 쿼리는 유저 클라이언트, Storage는 admin 유지 |

### 3.3 Supabase 클라이언트 구조

```
src/lib/supabase/
  ├── client.ts    # 브라우저용 (createBrowserClient)
  ├── server.ts    # 서버 컴포넌트/API Route용 (createServerClient + cookies)
  └── admin.ts     # service role (Storage 등 서버 전용)
```

### 3.4 인증 플로우 (변경 후)

```
[Splash Page]
  ├── "Continue with Google" → supabase.auth.signInWithOAuth({ provider: "google" })
  ├── "Login with Kakao"     → supabase.auth.signInWithOAuth({ provider: "kakao" })
  └── redirectTo: /auth/callback?next=/auth/redirect

[/auth/callback]  ← Supabase OAuth callback (code exchange)
  └── redirect to /auth/redirect

[/auth/redirect]  ← 프로필 존재 여부 확인
  ├── profile 있음 → /discover
  └── profile 없음 → /onboarding/account-mode
```

### 3.5 RLS Policy (Supabase 대시보드)

```sql
-- hair_profiles: 본인 데이터만 읽기/쓰기
CREATE POLICY "Users can read own profile"
  ON hair_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON hair_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON hair_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

> `user_id` 컬럼 타입이 현재 `text`(OAuth sub ID)라면 `uuid`로 변경 필요. Supabase Auth의 `auth.uid()`는 UUID를 반환.

---

## 4. Supabase 대시보드 설정 가이드 (선행 작업)

### 4.1 Google OAuth Provider

1. Supabase Dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Client ID / Client Secret: 기존 `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` 값 입력
4. Google Cloud Console → OAuth consent → Authorized redirect URI에 추가:
   `https://<project-ref>.supabase.co/auth/v1/callback`

### 4.2 Kakao OAuth Provider

1. Supabase Dashboard → Authentication → Providers → Kakao
2. Enable Kakao provider
3. Client ID / Client Secret: 기존 `AUTH_KAKAO_ID`, `AUTH_KAKAO_SECRET` 값 입력
4. Kakao Developers → 앱 설정 → Redirect URI에 추가:
   `https://<project-ref>.supabase.co/auth/v1/callback`

### 4.3 hair_profiles 테이블

1. `user_id` 컬럼 타입을 `uuid`로 변경 (또는 새 테이블 생성)
2. `user_id`에 FK: `auth.users(id)` 설정
3. RLS Enable → 위 3.5의 policy 적용
4. 기존 데이터 삭제 (신규 시작 합의됨)

---

## 5. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase OAuth 설정 실수로 로그인 불가 | High | 대시보드 설정 체크리스트 + 로컬에서 검증 후 배포 |
| `user_id` 타입 변경 시 기존 RPC 함수 오류 | Medium | RPC 함수(`get_hair_profile`, `update_avatar_url`) 시그니처 확인 및 수정 |
| middleware 세션 체크 오동작으로 무한 리디렉트 | High | matcher 경로 최소화 + 로그인 페이지 제외 |
| 쿠키 설정 미스로 서버/클라이언트 세션 불일치 | Medium | `@supabase/ssr` 공식 가이드 준수 |

---

## 6. Success Criteria

| ID | Criteria | Verification |
|----|----------|-------------|
| SC-01 | Google OAuth 로그인/로그아웃 정상 동작 | 수동 테스트 |
| SC-02 | Kakao OAuth 로그인/로그아웃 정상 동작 | 수동 테스트 |
| SC-03 | 로그인 → /auth/redirect → discover/onboarding 분기 정상 | 수동 테스트 |
| SC-04 | My 페이지에서 프로필 정상 표시 | 수동 테스트 |
| SC-05 | 프로필 편집 정상 동작 | 수동 테스트 |
| SC-06 | 아바타 업로드 정상 동작 | 수동 테스트 |
| SC-07 | 비로그인 유저 discover 접근 가능 | 수동 테스트 |
| SC-08 | `grep -r "supabaseAdmin"` 결과에서 유저 쿼리 0건 | 코드 검색 |
| SC-09 | `next-auth` 패키지 완전 제거 | `pnpm list` 확인 |

---

## 7. Implementation Order

| Step | Task | Dependencies |
|------|------|-------------|
| 1 | Supabase 대시보드: Google/Kakao provider + RLS 설정 | 없음 (선행) |
| 2 | `@supabase/ssr` 설치, `next-auth` 제거 | Step 1 |
| 3 | `src/lib/supabase/` 클라이언트 재구성 (client, server, admin) | Step 2 |
| 4 | `src/app/auth/callback/route.ts` 생성 (OAuth code exchange) | Step 3 |
| 5 | `src/middleware.ts` 재작성 (Supabase 세션) | Step 3 |
| 6 | `src/app/page.tsx` 로그인 버튼 전환 | Step 3 |
| 7 | `src/app/(main)/my/AccountActions.tsx` 로그아웃 전환 | Step 3 |
| 8 | 서버 컴포넌트/API Route의 `auth()` + `supabaseAdmin` → Supabase server client | Step 3 |
| 9 | NextAuth 파일 삭제 (`lib/auth/`, `api/auth/[...nextauth]/`) | Step 8 |
| 10 | 전체 플로우 수동 테스트 | Step 9 |
