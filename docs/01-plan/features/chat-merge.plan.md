# chat-merge Planning Document

> **Summary**: `/chat`과 `/messages` 두 중복 라우트를 `/messages` 기반으로 통합. `/chat`에만 있는 번역·퀵리플라이·새 대화 시작 플로우를 `/messages`로 이전하고, 누락된 DB 마이그레이션(quick_reply, content_translated)을 보충한 뒤 `/chat` 라우트를 제거한다.
>
> **Project**: curling-front
> **Version**: 0.1.0
> **Author**: syk
> **Date**: 2026-05-26
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 협업 과정에서 `/messages`(대화 목록·이미지·포트폴리오·헤어 프로필)와 `/chat`(번역·퀵리플라이·새 대화 시작)이 중복 구현됨. 타입 불일치, 데이터 모델 분산, 유지보수 부담 발생. |
| **Solution** | `/messages` 라우트를 기본으로 유지하고, `/chat`의 번역 시스템(useChat + /api/translate + MessageBubble 번역 토글)·퀵리플라이·새 대화 시작 플로우를 `/messages`에 통합. 누락된 quick_reply 테이블과 message.content_translated 컬럼 마이그레이션 추가 후 `/chat` 라우트 삭제. |
| **Function/UX Effect** | 사용자는 `/messages`에서 대화 목록 → 채팅방(이미지·포트폴리오·헤어 프로필·번역 포함) → 새 대화 시작(퀵리플라이)까지 일관된 단일 경로로 이용. 중복 진입점 혼란 해소. |
| **Core Value** | 코드베이스 단일 진실 소스(Single Source of Truth) 확보. 기능 중복 제거로 유지보수 비용 절감. 번역·퀵리플라이 기능 추가로 다국어 사용자 경험 향상. |

---

## Context Anchor

> Auto-generated from Executive Summary. Propagated to Design/Do documents for context continuity.

| Key | Value |
|-----|-------|
| **WHY** | `/chat`과 `/messages` 두 라우트가 동일 목적(1:1 채팅)으로 중복 존재하여 타입·데이터 모델 불일치, 유지보수 부담 발생. 단일 라우트로 통합하여 코드 품질과 사용자 경험을 동시에 개선한다. |
| **WHO** | (1) 디자이너에게 메시지를 보내려는 고객, (2) 다국어 환경에서 번역이 필요한 고객/디자이너, (3) 새 대화를 시작하며 퀵리플라이를 사용하는 고객. |
| **RISK** | (1) `/messages/[id]/ChatRoomClient.tsx`(723줄) 수정 범위가 넓어 회귀 위험. (2) `/chat`에서 참조하는 `onboarding_profiles` 필드명(`name`/`avatar_url`)과 `/messages`의 필드명(`display_name`/`profile_image_url`) 불일치 해소 필요. (3) quick_reply 테이블 미생성 시 `/messages/new` 런타임 에러. (4) 번역 API 의존성(Google Translate) 장애 시 graceful fallback 필요. |
| **SUCCESS** | (a) `/messages` 목록·채팅방·새 대화 3개 라우트가 정상 동작. (b) `/chat` 라우트 완전 제거, 잔여 import 0. (c) 번역 토글이 채팅방에서 동작. (d) 퀵리플라이가 새 대화 시작 시 표시. (e) 기존 이미지·포트폴리오·헤어 프로필 기능 회귀 0. (f) quick_reply + content_translated 마이그레이션 적용. |
| **SCOPE** | IN: `/chat` → `/messages` 기능 통합, 번역 시스템, 퀵리플라이, 새 대화 플로우, DB 마이그레이션 2건, `/chat` 라우트 제거. OUT: 그룹 채팅, 푸시 알림, 타이핑 인디케이터, 읽음 처리 UI, 새 UI 디자인. |

---

## 1. Overview

### 1.1 Purpose

커밋 `1a2515c`에서 구현된 `/messages` 라우트(대화 목록 + 채팅방 + 이미지/포트폴리오/헤어 프로필)와, 커밋 `3d2b891`에서 디자인 시스템 리디파인과 함께 추가된 `/chat` 라우트(번역 + 퀵리플라이 + 새 대화 시작)가 동일 목적으로 중복 존재한다. 본 PDCA는 `/messages`를 기본 라우트로 유지하면서 `/chat`에만 있는 기능을 통합하고, `/chat` 라우트를 제거하여 단일 메시징 시스템을 완성한다.

### 1.2 Background

- **`/messages` (원본, 1a2515c)**: 서버사이드 데이터 페칭, 대화 목록(읽지 않은 수 배지), 채팅방(ChatRoomClient 723줄, 이미지 업로드, 포트폴리오 피커, 헤어 프로필 전송, Realtime 구독, 웰컴 메시지)
- **`/chat` (중복, 3d2b891)**: 클라이언트 훅 기반 데이터 로딩, 번역 시스템(`useChat` + `/api/translate` + `MessageBubble` 원문/번역 토글), 새 대화 시작 플로우(`/chat/new/[designerId]`, 퀵리플라이), 다국어 지원
- **DB 상태**: `conversation` + `message` 테이블 존재, `message_type`/`image_url` 컬럼 추가됨. 그러나 `quick_reply` 테이블 마이그레이션 누락, `content_translated`/`sender_lang` 컬럼 미존재.

### 1.3 Related Documents

- 직전 Plan: [`docs/01-plan/features/messages.plan.md`](messages.plan.md) (placeholder 단계)
- 메시징 마이그레이션: `supabase/migrations/20260525000001_create_messaging.sql`
- 이미지 지원 마이그레이션: `supabase/migrations/20260525000002_message_image_support.sql`
- 디자인 시스템: `src/app/globals.css`, `src/styles/typography.css`

---

## 2. Scope

### 2.1 In Scope

- [ ] `/chat`의 번역 시스템을 `/messages/[id]` 채팅방에 통합
  - `useChat` 훅의 번역 로직 → `ChatRoomClient`에 통합 또는 별도 훅으로 분리
  - `/api/translate` 라우트 유지 (이미 존재)
  - `MessageBubble`의 번역 토글 UI → 채팅방 메시지 렌더에 적용
- [ ] `/chat/new/[designerId]` 플로우를 `/messages/new/[designerId]`로 이전
  - 기존 대화 중복 체크 → 기존 대화방으로 리다이렉트
  - 퀵리플라이 버튼 (quick_reply 테이블 연동)
  - 첫 메시지 전송 → 대화 생성 → `/messages/[id]`로 리다이렉트
- [ ] DB 마이그레이션 작성
  - `quick_reply` 테이블 생성 (id, type, content JSONB, sort_order, is_active)
  - `message` 테이블에 `content_translated` (JSONB) + `sender_lang` (VARCHAR) 컬럼 추가
- [ ] 공유 컴포넌트 정리
  - `MessageBubble` → 번역 토글 기능을 포함한 통합 버전
  - `MessageInput` → 기존 `ChatRoomClient`의 입력/첨부 패널과 통합 또는 교체 결정
- [ ] 타입 통일
  - `Message` 타입에 `content_translated`, `sender_lang` 필드 추가
  - `/chat`과 `/messages`의 필드명 불일치 해소 (`name` vs `display_name`, `avatar_url` vs `profile_image_url`)
- [ ] `/chat` 라우트 및 관련 미사용 코드 삭제
  - `src/app/(main)/chat/` 디렉토리 전체
  - 미사용 컴포넌트: `RecentChatItem`, `QuickReplyMenu`, `FavoriteDesignerItem`, `StartConversationRow` (통합 시 필요한 것은 이전)
- [ ] BottomNav 및 기타 참조에서 `/chat` → `/messages` 경로 정리

### 2.2 Out of Scope

- 그룹 채팅, 다중 참여자 대화
- 푸시 알림 / 타이핑 인디케이터
- 읽음 처리 UI (DB에 `is_read` 존재하나 UI 미구현 유지)
- 새 UI 디자인 (기존 `/messages` UI 유지, `/chat`의 기능만 이식)
- 번역 API 변경 (Google Translate 유지)
- 디자이너 측 채팅 화면 (현재 고객 관점만)
- `/api/seed-chat` 테스트 라우트 리팩터링

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `/messages` 대화 목록 페이지가 기존과 동일하게 동작 (읽지 않은 수 배지, 마지막 메시지 미리보기, 시간 포맷) | High | Pending |
| FR-02 | `/messages/[id]` 채팅방에서 텍스트/이미지 메시지 전송·수신이 정상 동작 (기존 기능 회귀 0) | High | Pending |
| FR-03 | `/messages/[id]` 채팅방에서 포트폴리오 피커, 헤어 프로필 전송이 정상 동작 (기존 기능 회귀 0) | High | Pending |
| FR-04 | `/messages/[id]` 채팅방의 각 메시지 버블에 번역 토글 기능 추가. 상대방 언어 메시지에 "번역 보기" 표시, 클릭 시 번역 결과 표시/원문 토글. | High | Pending |
| FR-05 | `/messages/new/[designerId]` 라우트 신설. 디자이너 프로필 표시 + 웰컴 메시지 + 퀵리플라이 버튼. | High | Pending |
| FR-06 | `/messages/new/[designerId]` 진입 시 기존 대화가 있으면 `/messages/[conversationId]`로 자동 리다이렉트 | High | Pending |
| FR-07 | 퀵리플라이 클릭 또는 직접 입력 시 conversation 생성 → 첫 메시지 저장 → `/messages/[id]`로 리다이렉트 | High | Pending |
| FR-08 | `quick_reply` 테이블 마이그레이션 + 기본 시드 데이터 (인사, 예약 문의, 가격 문의 등 3-5개) | Medium | Pending |
| FR-09 | `message` 테이블에 `sender_lang` (VARCHAR) + `content_translated` (JSONB) 컬럼 추가 마이그레이션 | Medium | Pending |
| FR-10 | `/chat` 라우트 전체 삭제. 프로젝트 내 `/chat` 경로 참조 0. | High | Pending |
| FR-11 | Realtime 구독이 번역 컬럼 포함하여 정상 동작 (새 메시지 수신 시 번역 자동 트리거) | Medium | Pending |
| FR-12 | Message 타입 통일: 기존 `types/message.ts`에 `sender_lang`, `content_translated` 필드 추가 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 번역 API 호출은 메시지 렌더 시 lazy로 실행, 메시지 목록 초기 로드 차단 금지 | 코드 리뷰 |
| Resilience | 번역 API 실패 시 원문만 표시, 에러 상태는 해당 메시지 버블에만 표시 | 수동 테스트 |
| Visual Consistency | 디자인 토큰(CLAUDE.md) 준수. 하드코딩 색/폰트 금지 | 코드 리뷰 |
| Data Integrity | 기존 conversation/message 데이터 영향 0. 마이그레이션은 ADD COLUMN + DEFAULT | 마이그레이션 리뷰 |
| 모바일 우선 | 모든 화면 390px 폭 기준 정상 렌더 | 브라우저 수동 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `/messages`, `/messages/[id]`, `/messages/new/[designerId]` 3개 라우트 정상 동작
- [ ] `/chat` 라우트 완전 제거, grep `/chat` → 라우트 참조 0
- [ ] 채팅방에서 번역 토글 동작 (원문 ↔ 번역)
- [ ] 새 대화 시작 시 퀵리플라이 표시 및 첫 메시지 전송 성공
- [ ] 기존 기능 회귀 0: 이미지 업로드, 포트폴리오 피커, 헤어 프로필 전송
- [ ] `quick_reply` 테이블 마이그레이션 + 시드 데이터 존재
- [ ] `message.sender_lang` + `message.content_translated` 컬럼 마이그레이션 존재

### 4.2 Quality Criteria

- [ ] Zero lint errors (`pnpm lint`)
- [ ] TypeScript strict 통과
- [ ] CLAUDE.md 디자인 토큰 규칙 준수
- [ ] 잔여 미사용 import/컴포넌트 0 (dead code 제거)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `ChatRoomClient.tsx` (723줄) 수정 범위가 커서 회귀 발생 | High | Medium | 번역 로직을 별도 훅(`useTranslation`)으로 분리하여 기존 코드 변경 최소화. 기능별 단위 테스트 우선. |
| 필드명 불일치 (`name` vs `display_name`, `avatar_url` vs `profile_image_url`) | Medium | High | 통합 시 DB 스키마 기준으로 통일. 프론트 매핑 레이어에서 일관된 필드 사용. |
| `quick_reply` 테이블 마이그레이션 순서 오류 | Medium | Low | 기존 마이그레이션 번호(`20260525000002`) 이후 번호 배정. foreign key 없으므로 독립적. |
| 번역 API(Google Translate) 비용/속도 | Low | Medium | 번역 결과를 `content_translated` 컬럼에 캐시. 같은 메시지 재번역 방지. |
| Realtime 구독에서 번역 컬럼 포함 시 payload 증가 | Low | Low | Supabase Realtime은 전체 row 전송. 컬럼 추가에 의한 payload 증가는 미미. |
| `/chat` 삭제 시 다른 곳에서 참조하는 경로 누락 | Medium | Medium | 삭제 전 grep으로 `/chat` 경로 참조 전수 조사. BottomNav, Link 컴포넌트 등 확인. |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/app/(main)/messages/[id]/ChatRoomClient.tsx` | Client Component | 번역 토글 UI 추가, MessageBubble 컴포넌트 적용 또는 인라인 번역 로직 추가 |
| `src/app/(main)/messages/new/[designerId]/page.tsx` | Page (신규) | `/chat/new/[designerId]`에서 이전. 퀵리플라이 + 대화 시작 플로우 |
| `src/hooks/useChat.ts` | Hook | 번역 로직 추출 → `useTranslation` 훅으로 분리하거나, ChatRoomClient에 직접 통합 |
| `src/components/chat/MessageBubble.tsx` | Component | 번역 토글 기능 유지. ChatRoomClient에서 사용하도록 적용 |
| `src/components/chat/MessageInput.tsx` | Component | 기존 ChatRoomClient의 입력 UI와 통합 여부 결정 (Design 단계) |
| `src/types/message.ts` | Type | `sender_lang`, `content_translated` 필드 추가 |
| `src/lib/messages.ts` | Library | 반환 타입에 번역 필드 포함 |
| `supabase/migrations/` | Migration (신규 2건) | quick_reply 테이블, message 번역 컬럼 |
| `src/app/(main)/chat/` | Route (삭제) | 전체 디렉토리 삭제 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `ChatRoomClient` | render messages | `src/app/(main)/messages/[id]/ChatRoomClient.tsx` | 메시지 버블 렌더에 번역 토글 추가. 기존 텍스트/이미지 렌더는 유지. |
| `MessagesClient` | list conversations | `src/app/(main)/messages/MessagesClient.tsx` | 변경 없음. 대화 목록은 그대로 유지. |
| `getMessages()` | fetch messages | `src/lib/messages.ts` | 반환 타입에 `sender_lang`, `content_translated` 추가 (nullable) |
| `useChat` hook | chat logic | `src/hooks/useChat.ts` | `/chat` 라우트 삭제 후 번역 로직만 추출하여 재활용하거나 삭제 |
| `BottomNav` | navigation | `src/components/ui/BottomNav.tsx` | `/messages` 경로 유지. 변경 불필요. |
| `/api/translate` | translate text | `src/app/api/translate/route.ts` | 변경 없음. 그대로 유지. |
| `/api/seed-chat` | dev seeding | `src/app/api/seed-chat/route.ts` | `/messages` URL 참조 유지. 변경 불필요. |

### 6.3 Verification

- [ ] `/messages` 대화 목록 진입 → 기존과 동일하게 표시
- [ ] `/messages/[id]` 채팅방 → 텍스트/이미지 메시지 전송·수신 정상
- [ ] `/messages/[id]` 채팅방 → 포트폴리오 피커·헤어 프로필 전송 정상
- [ ] `/messages/[id]` 채팅방 → 상대 메시지에 번역 토글 표시·동작
- [ ] `/messages/new/[designerId]` → 디자이너 프로필 + 퀵리플라이 표시
- [ ] `/messages/new/[designerId]` → 기존 대화 있으면 리다이렉트
- [ ] `/messages/new/[designerId]` → 첫 메시지 전송 → 대화 생성 → 채팅방 리다이렉트
- [ ] grep `src/app/(main)/chat` → 0 결과 (완전 삭제 확인)
- [ ] grep `"/chat"` or `'/chat'` → 라우트 참조 0 (BottomNav 등)
- [ ] `quick_reply` 테이블 존재 + 시드 데이터 조회 가능
- [ ] `message` 테이블에 `sender_lang`, `content_translated` 컬럼 존재

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend, SaaS MVPs | ☑ |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 기본 라우트 | `/messages` / `/chat` | **`/messages`** | 사용자 확인 완료. 기존 기능이 더 완성도 높음. |
| 번역 통합 방식 | (a) useChat 훅 통합 / (b) useTranslation 분리 / (c) ChatRoomClient 인라인 | **Design에서 결정** | (b)가 관심사 분리에 유리. |
| MessageBubble 통합 | (a) `/chat`의 MessageBubble 사용 / (b) 기존 인라인 렌더 유지 + 번역 추가 / (c) 새 통합 컴포넌트 | **Design에서 결정** | (a)가 재사용 용이하나 기존 이미지 렌더와 호환 확인 필요. |
| MessageInput 통합 | (a) `/chat`의 MessageInput 사용 / (b) 기존 ChatRoomClient 입력 유지 | **Design에서 결정** | 기존 ChatRoomClient의 첨부 패널이 더 기능 풍부. |
| 번역 캐시 | (a) DB 저장 (content_translated) / (b) 클라이언트 메모리 캐시만 | **(a) DB 저장** | 사용자 확인 완료. 같은 메시지 재번역 방지. |
| quick_reply 데이터 | (a) DB 테이블 / (b) 하드코딩 | **(a) DB 테이블** | 사용자 확인 완료. 다국어 컨텐츠 관리 용이. |

### 7.3 Folder Structure Preview (통합 후)

```
src/
  app/
    (main)/
      messages/
        page.tsx                          # 대화 목록 (기존 유지)
        MessagesClient.tsx                # 대화 목록 클라이언트 (기존 유지)
        [id]/
          page.tsx                        # 채팅방 서버 컴포넌트 (기존 유지)
          ChatRoomClient.tsx              # 채팅방 + 번역 통합 (수정)
        new/
          [designerId]/
            page.tsx                      # 새 대화 시작 (이전)
      chat/                               # ← 삭제
    api/
      translate/route.ts                  # 번역 API (유지)
  components/
    chat/
      MessageBubble.tsx                   # 번역 토글 포함 (유지/통합)
      MessageInput.tsx                    # 통합 여부 Design에서 결정
  hooks/
    useChat.ts                            # 번역 로직 추출 후 재활용 또는 삭제
  types/
    message.ts                            # sender_lang, content_translated 추가
  lib/
    messages.ts                           # 반환 타입 확장
```

### 7.4 DB 마이그레이션 계획

#### 마이그레이션 1: quick_reply 테이블

```sql
-- 20260526000001_create_quick_reply.sql
CREATE TABLE IF NOT EXISTS public.quick_reply (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       VARCHAR(20) NOT NULL DEFAULT 'greeting',
  content    JSONB NOT NULL,           -- { "ko": "...", "en": "...", "ja": "..." }
  sort_order INT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 시드 데이터 (3-5개)
INSERT INTO public.quick_reply (type, content, sort_order) VALUES
  ('greeting', '{"ko":"안녕하세요! 상담 받고 싶어요","en":"Hi! I'd like a consultation","ja":"こんにちは！相談したいです"}', 1),
  ('booking', '{"ko":"예약 가능한 날짜가 언제인가요?","en":"When are you available?","ja":"予約可能な日はいつですか？"}', 2),
  ('price', '{"ko":"가격이 어떻게 되나요?","en":"How much does it cost?","ja":"料金はいくらですか？"}', 3);
```

#### 마이그레이션 2: message 번역 컬럼

```sql
-- 20260526000002_message_translation_support.sql
ALTER TABLE public.message
  ADD COLUMN IF NOT EXISTS sender_lang VARCHAR(10),
  ADD COLUMN IF NOT EXISTS content_translated JSONB;
-- content_translated 예: { "ko": "번역된 텍스트", "en": "translated text" }
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] `CLAUDE.md` 코딩 컨벤션 + 디자인 토큰 규칙
- [x] TypeScript strict mode
- [x] Tailwind v4 + 토큰 기반 색/폰트 시스템
- [x] App Router 서버 컴포넌트 + `"use client"` 패턴
- [x] Supabase 마이그레이션 네이밍: `YYYYMMDD000NNN_description.sql`

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| 번역 훅 패턴 | `useChat`에 번역 로직 포함 | 번역 전용 훅 분리 여부 (Design에서 결정) | High |
| 메시지 버블 컴포넌트 | 인라인(ChatRoomClient) + MessageBubble 2중 존재 | 단일 MessageBubble 컴포넌트로 통일 | High |
| 퀵리플라이 타입 | 미정의 | `QuickReply` 타입 정의 (types/message.ts에 추가) | Medium |

### 8.3 Environment Variables Needed

| Variable | Purpose | Status |
|----------|---------|--------|
| `GOOGLE_TRANSLATE_API_KEY` | 번역 API 키 (기존 `/api/translate`에서 사용) | 기존 존재 확인 필요 |

---

## 9. Next Steps

1. [ ] `/pdca design chat-merge` — 3개 아키텍처 옵션 비교 (번역 통합 방식, MessageBubble/Input 통합 전략)
2. [ ] Design 승인 후 `/pdca do chat-merge`
3. [ ] 마이그레이션 적용 후 기존 기능 회귀 수동 검증

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-26 | Initial draft — /chat ↔ /messages 통합 Plan | syk |
