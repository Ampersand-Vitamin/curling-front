# chat-merge Design Document

> **Summary**: `/chat`과 `/messages` 중복 라우트를 `/messages` 기반으로 통합. Option C (Pragmatic Balance) 채택 — `useTranslation` 훅 분리, 기존 ChatRoomClient 버블에 번역 토글 추가, Composer 유지, 새 대화 시작 플로우 이전.
>
> **Project**: curling-front
> **Version**: 0.1.0
> **Author**: syk
> **Date**: 2026-05-26
> **Status**: Draft
> **Architecture**: Option C — Pragmatic Balance

---

## Context Anchor

> Propagated from Plan document for cross-session context continuity.

| Key | Value |
|-----|-------|
| **WHY** | `/chat`과 `/messages` 두 라우트가 동일 목적(1:1 채팅)으로 중복 존재하여 타입·데이터 모델 불일치, 유지보수 부담 발생. 단일 라우트로 통합하여 코드 품질과 사용자 경험을 동시에 개선한다. |
| **WHO** | (1) 디자이너에게 메시지를 보내려는 고객, (2) 다국어 환경에서 번역이 필요한 고객/디자이너, (3) 새 대화를 시작하며 퀵리플라이를 사용하는 고객. |
| **RISK** | (1) ChatRoomClient(723줄) 수정 시 회귀 위험. (2) 필드명 불일치 해소 필요. (3) quick_reply 테이블 미생성 시 런타임 에러. (4) 번역 API 장애 시 fallback 필요. |
| **SUCCESS** | (a) 3개 라우트 정상 동작. (b) `/chat` 완전 제거. (c) 번역 토글 동작. (d) 퀵리플라이 표시. (e) 기존 기능 회귀 0. (f) 마이그레이션 2건 적용. |
| **SCOPE** | IN: 번역 통합, 퀵리플라이, 새 대화 플로우, DB 마이그레이션 2건, `/chat` 삭제. OUT: 그룹 채팅, 푸시 알림, 타이핑 인디케이터, 새 UI 디자인. |

---

## 1. Overview

### 1.1 Architecture Decision

**Option C — Pragmatic Balance** 선택 근거:

| 기준 | A. Minimal | B. Clean | **C. Pragmatic** |
|------|:----------:|:--------:|:----------------:|
| 변경 파일 수 | 4 | 8+ | **6** |
| 회귀 위험 | Low | High | **Low-Medium** |
| 번역 재사용 | No | Yes | **Yes** |
| Composer 안정성 | 유지 | 리팩터 | **유지** |
| 향후 유지보수 | 나쁨 | 최고 | **좋음** |

핵심 전략:
1. `useChat` 훅에서 **번역 로직만** 추출하여 `useTranslation` 훅으로 분리
2. ChatRoomClient의 **기존 버블(DesignerBubble/MyBubble)에 번역 토글 UI 추가** (인라인)
3. Composer(이미지 업로드/포트폴리오/헤어 프로필)는 **그대로 유지**
4. `/chat/new/[designerId]` → `/messages/new/[designerId]`로 **이전** (경로만 변경)

### 1.2 Related Documents

- Plan: [`docs/01-plan/features/chat-merge.plan.md`](../../01-plan/features/chat-merge.plan.md)
- 기존 Design 참고: [`docs/02-design/features/designer-detail.design.md`](designer-detail.design.md)

---

## 2. Data Model

### 2.1 기존 테이블 (변경 없음)

```sql
-- conversation (20260525000001)
conversation (id, client_id, designer_id, last_message_at, created_at)

-- message (20260525000001 + 20260525000002)
message (id, conversation_id, sender_id, content, is_read, message_type, image_url, created_at)
```

### 2.2 마이그레이션 1: message 번역 컬럼 추가

```sql
-- supabase/migrations/20260526000001_message_translation_support.sql
ALTER TABLE public.message
  ADD COLUMN IF NOT EXISTS sender_lang VARCHAR(10),
  ADD COLUMN IF NOT EXISTS content_translated JSONB;

-- content_translated 구조: { "ko": "번역된 텍스트", "en": "translated text" }
-- sender_lang: 발신자의 언어 코드 (e.g., "ko", "en", "ja")
-- 기존 메시지는 NULL (번역 불필요 = 원문만 표시)
```

### 2.3 마이그레이션 2: quick_reply 테이블 생성

```sql
-- supabase/migrations/20260526000002_create_quick_reply.sql
CREATE TABLE IF NOT EXISTS public.quick_reply (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       VARCHAR(20) NOT NULL DEFAULT 'greeting',
  content    JSONB NOT NULL,           -- { "ko": "...", "en": "...", "ja": "..." }
  sort_order INT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: 모든 인증 유저 읽기 허용
ALTER TABLE public.quick_reply ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quick_reply_select" ON public.quick_reply FOR SELECT
  USING (true);

-- 시드 데이터
INSERT INTO public.quick_reply (type, content, sort_order) VALUES
  ('greeting', '{"ko":"안녕하세요! 상담 받고 싶어요","en":"Hi! I''d like a consultation","ja":"こんにちは！相談したいです"}', 1),
  ('booking',  '{"ko":"예약 가능한 날짜가 언제인가요?","en":"When are you available?","ja":"予約可能な日はいつですか？"}', 2),
  ('price',    '{"ko":"가격이 어떻게 되나요?","en":"How much does it cost?","ja":"料金はいくらですか？"}', 3);
```

### 2.4 타입 정의 변경

```typescript
// src/types/message.ts — 통합 Message 타입
export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: "text" | "image";
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
  // 번역 관련 (신규)
  senderLang: string | null;
  contentTranslated: Record<string, string> | null;
};

// QuickReply 타입 (신규)
export type QuickReply = {
  id: string;
  type: string;
  content: Record<string, string>;  // { "ko": "...", "en": "..." }
  sortOrder: number;
  isActive: boolean;
};
```

---

## 3. Component Architecture

### 3.1 변경 파일 맵

```
src/
  hooks/
    useTranslation.ts              [신규] 번역 로직 (useChat에서 추출)
  types/
    message.ts                     [수정] senderLang, contentTranslated 추가, QuickReply 추가
  lib/
    messages.ts                    [수정] getMessages 반환에 번역 필드 포함
  app/(main)/messages/
    [id]/ChatRoomClient.tsx        [수정] 번역 토글 UI 추가 (~40줄 추가)
    new/[designerId]/page.tsx      [신규] chat/new에서 이전 + 경로 수정
  app/(main)/chat/                 [삭제] 전체 디렉토리
  hooks/useChat.ts                 [삭제] 번역 로직은 useTranslation으로 이전
  components/chat/MessageBubble.tsx  [삭제] 미사용 (기존 인라인 버블 유지)
  components/chat/MessageInput.tsx   [삭제] 미사용 (기존 Composer 유지)
```

### 3.2 useTranslation 훅 설계

```typescript
// src/hooks/useTranslation.ts
// useChat 훅에서 번역 관련 로직만 추출

type UseTranslationOptions = {
  myLang: string;              // 현재 사용자 언어
  enabled?: boolean;           // 번역 활성화 여부 (default: true)
};

type TranslationState = {
  translations: Map<string, string>;  // msgId → 번역 텍스트
  translating: Set<string>;           // 현재 번역 중인 msgId
  getTranslation: (msg: Message) => string | null;
  isTranslating: (msgId: string) => boolean;
};

export function useTranslation(
  messages: Message[],
  options: UseTranslationOptions
): TranslationState;

// 내부 동작:
// 1. messages 변경 시, sender_lang ≠ myLang인 메시지 필터링
// 2. content_translated[myLang]이 있으면 캐시 히트 → translations에 저장
// 3. 없으면 /api/translate 호출 → 결과를 translations + DB(content_translated) 저장
// 4. translating Set으로 로딩 상태 관리
```

### 3.3 ChatRoomClient 번역 통합

기존 `DesignerBubble`/`MyBubble` 컴포넌트에 번역 토글을 추가합니다.

```
변경 전 (현재):
  DesignerBubble → BubbleContent → <p>{message.content}</p>

변경 후:
  DesignerBubble → BubbleContent + 번역 토글 버튼
    - getTranslation(msg)이 있으면 번역 텍스트 표시
    - isTranslating(msg.id)이면 "번역 중..." 표시
    - 토글 버튼: "원문 보기" ↔ "번역 보기"
```

**ChatRoomClient 수정 범위:**

| 영역 | 변경 내용 | 예상 줄 수 |
|------|---------|-----------|
| import | `useTranslation` 훅 import | +1 |
| 컴포넌트 본문 | `useTranslation` 호출 + myLang state | +8 |
| `DesignerBubble` | 번역 텍스트 표시 + 토글 버튼 | +15 |
| `MyBubble` | 번역 텍스트 표시 (토글은 상대 메시지만) | +5 |
| Realtime 구독 | payload에 `sender_lang`, `content_translated` 추가 | +4 |
| `handleSend` | `sender_lang` 필드 추가 | +2 |
| **합계** | | **~35줄 추가** |

**변경하지 않는 것:**
- `ChatHeader` — 그대로 유지
- `WelcomeMessage` — 그대로 유지
- `BubbleContent` — 이미지 렌더 로직 그대로 유지
- `PortfolioPicker` — 그대로 유지
- `AttachPanel` — 그대로 유지
- `Composer` — 그대로 유지 (이미지 업로드, 포트폴리오, 헤어 프로필 모두 유지)

### 3.4 messages/new/[designerId] 페이지

`/chat/new/[designerId]/page.tsx`를 기반으로 `/messages/new/[designerId]/page.tsx` 생성.

**변경 사항:**
1. 리다이렉트 경로: `/chat/${existing.id}` → `/messages/${existing.id}`
2. 대화 생성 후 리다이렉트: `/chat/${convId}` → `/messages/${convId}`
3. `MessageInput` 대신 기존 Composer 스타일의 간소화된 입력 UI 사용 (또는 인라인 input)
4. `quick_reply` 테이블에서 사용자 언어 기준 컨텐츠 표시
5. 디자이너 프로필 조회: `onboarding_profiles` → `designer_profile` 테이블 매핑 확인

**기능 흐름:**
```
1. 진입 → supabase.auth.getUser()
2. 기존 대화 확인 → conversation.select().eq(client_id, designer_id)
   → 있으면 /messages/[id]로 리다이렉트
3. 디자이너 프로필 표시 (이름, 살롱, 아바타)
4. 웰컴 메시지 + 퀵리플라이 버튼 3개
5. 퀵리플라이 클릭 또는 직접 입력:
   → conversation.insert() → message.insert() → /messages/[id]로 리다이렉트
```

### 3.5 lib/messages.ts 변경

`getMessages()` 함수의 select에 번역 필드 추가:

```typescript
// 변경 전
.select("id, conversation_id, sender_id, content, message_type, image_url, is_read, created_at")

// 변경 후
.select("id, conversation_id, sender_id, content, message_type, image_url, is_read, created_at, sender_lang, content_translated")

// 매핑에 추가
senderLang: m.sender_lang ?? null,
contentTranslated: m.content_translated ?? null,
```

### 3.6 Realtime 구독 변경

ChatRoomClient의 Realtime payload 처리에 번역 필드 추가:

```typescript
// 변경 전 payload 타입
{ id, conversation_id, sender_id, content, message_type, image_url, is_read, created_at }

// 변경 후 payload 타입
{ id, conversation_id, sender_id, content, message_type, image_url, is_read, created_at,
  sender_lang, content_translated }
```

---

## 4. API Design

### 4.1 기존 API (변경 없음)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/translate` | POST | `{ text, targetLang, sourceLang }` → `{ translatedText }` |
| `/api/onboarding` | GET | 헤어 프로필 조회 (Composer에서 사용) |

### 4.2 신규 API

없음. 모든 DB 접근은 Supabase client 직접 사용.

---

## 5. State Management

### 5.1 ChatRoomClient State 변경

| State | 현재 | 추가 |
|-------|------|------|
| `messages` | `useState<Message[]>` | 타입에 `senderLang`, `contentTranslated` 추가 |
| `myLang` | 없음 | `useState<string>` — 사용자 언어 (서버에서 전달 또는 클라이언트 fetch) |

### 5.2 useTranslation 내부 State

| State | Type | Purpose |
|-------|------|---------|
| `translations` | `Map<string, string>` | msgId → 번역 결과 캐시 |
| `translating` | `Set<string>` | 현재 번역 API 호출 중인 msgId |

### 5.3 새 대화 페이지 State

| State | Type | Purpose |
|-------|------|---------|
| `myId` | `string` | 현재 사용자 ID |
| `myLang` | `string` | 현재 사용자 언어 |
| `designerName/Salon/Avatar` | `string` | 디자이너 프로필 |
| `quickReplies` | `string[]` | 퀵리플라이 텍스트 |
| `sending` | `boolean` | 전송 중 로딩 |

---

## 6. Routing

### 6.1 최종 라우트 구조

| 경로 | 유형 | 컴포넌트 | 설명 |
|------|------|---------|------|
| `/messages` | Server → Client | `MessagesClient` | 대화 목록 (변경 없음) |
| `/messages/[id]` | Server → Client | `ChatRoomClient` | 채팅방 + 번역 (수정) |
| `/messages/new/[designerId]` | Client | `NewConversationPage` | 새 대화 시작 (신규) |

### 6.2 삭제 라우트

| 경로 | 상태 |
|------|------|
| `/chat/[conversationId]` | 삭제 |
| `/chat/new/[designerId]` | 삭제 (→ `/messages/new/[designerId]`로 이전) |

### 6.3 외부 참조 경로 수정

| 참조 위치 | 현재 | 변경 후 |
|----------|------|--------|
| `/chat/new/[designerId]` 내부 리다이렉트 | `/chat/${id}` | `/messages/${id}` |
| BottomNav | `/messages` (유지) | 변경 없음 |
| Designer detail 메시지 아이콘 | `/messages/${id}` (유지) | 변경 없음 |

---

## 7. Error Handling

### 7.1 번역 실패

```
번역 API 호출 실패:
  → useTranslation이 catch
  → 해당 메시지 translating Set에서 제거
  → 원문 그대로 표시 (graceful fallback)
  → 콘솔에 경고 로그
  → 사용자에게 별도 에러 UI 없음 (원문이 보이므로)
```

### 7.2 quick_reply 테이블 미존재

```
DB 쿼리 실패:
  → 기본 하드코딩 퀵리플라이 3개 표시 (DEFAULT_QUICK_REPLIES)
  → 콘솔에 경고 로그
```

### 7.3 기존 대화 리다이렉트 실패

```
conversation 조회 실패:
  → 새 대화 생성 플로우 그대로 진행
  → 중복 대화 방지는 UNIQUE(client_id, designer_id) 제약이 보장
```

---

## 8. Test Plan

### 8.1 회귀 테스트 (기존 기능)

| # | 시나리오 | 검증 |
|---|---------|------|
| T1 | `/messages` 목록 진입 | 대화 목록 정상 표시, 읽지 않은 수 배지 |
| T2 | `/messages/[id]` 채팅방 진입 | 메시지 목록 + 웰컴 메시지 표시 |
| T3 | 텍스트 메시지 전송 | optimistic UI + DB 저장 + Realtime 수신 |
| T4 | 이미지 메시지 전송 | Storage 업로드 + 버블 렌더 |
| T5 | 포트폴리오 피커 | 디자이너 포트폴리오 로드 + 선택 + 전송 |
| T6 | 헤어 프로필 전송 | /api/onboarding 조회 + 텍스트로 변환 |
| T7 | BottomNav Messages 탭 active | 3개 라우트 모두 active |

### 8.2 신규 기능 테스트

| # | 시나리오 | 검증 |
|---|---------|------|
| T8 | 상대 메시지 번역 | sender_lang ≠ myLang → "번역 중..." → 번역 결과 표시 |
| T9 | 번역 토글 | "원문 보기" ↔ "번역 보기" 클릭 시 전환 |
| T10 | 번역 API 실패 | 원문 그대로 표시, 에러 없음 |
| T11 | `/messages/new/[designerId]` 진입 | 디자이너 프로필 + 퀵리플라이 표시 |
| T12 | 기존 대화 리다이렉트 | 대화 존재 시 `/messages/[id]`로 이동 |
| T13 | 퀵리플라이 클릭 | 대화 생성 + 메시지 저장 + 리다이렉트 |
| T14 | 직접 입력 전송 | 동일 플로우 |

### 8.3 정리 확인

| # | 시나리오 | 검증 |
|---|---------|------|
| T15 | `/chat` 경로 접근 | 404 (라우트 삭제됨) |
| T16 | grep `/chat` | 프로젝트 내 라우트 참조 0 |
| T17 | 미사용 파일 | `MessageBubble.tsx`, `MessageInput.tsx`, `useChat.ts` 삭제 확인 |

---

## 9. Security Considerations

### 9.1 RLS 정책

- `quick_reply` 테이블: 모든 인증 유저 SELECT 허용 (공개 컨텐츠)
- `message.content_translated` 업데이트: 기존 message RLS 정책으로 보호 (참여자만)
- 번역 API: 서버사이드 `/api/translate` 경유 → API 키 노출 없음

### 9.2 입력 검증

- 번역 요청: `text` 빈 문자열 / 과도하게 긴 문자열 → 기존 API 검증 유지
- 메시지 전송: `sender_lang`은 사용자 프로필에서 추출, 클라이언트 조작 불가

---

## 10. Migration Plan

### 10.1 실행 순서

```
1. DB 마이그레이션 2건 적용 (순서 중요)
   ① 20260526000001_message_translation_support.sql
   ② 20260526000002_create_quick_reply.sql

2. 코드 변경 (순서)
   ① types/message.ts 타입 확장
   ② lib/messages.ts getMessages 확장
   ③ hooks/useTranslation.ts 생성
   ④ ChatRoomClient.tsx 번역 통합
   ⑤ messages/new/[designerId]/page.tsx 생성
   ⑥ /chat 라우트 삭제
   ⑦ useChat.ts, MessageBubble.tsx, MessageInput.tsx 삭제
   ⑧ 미사용 컴포넌트 정리 (RecentChatItem 등)
```

### 10.2 롤백 전략

- DB 마이그레이션: `ADD COLUMN`이므로 기존 데이터 영향 0. 롤백 시 `DROP COLUMN`
- 코드: git revert로 원복 가능. `/chat` 삭제는 마지막 단계.

---

## 11. Implementation Guide

### 11.1 Implementation Order

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 1 | DB 마이그레이션 작성 | `supabase/migrations/20260526000001_*.sql`, `20260526000002_*.sql` | — |
| 2 | Message 타입 확장 | `src/types/message.ts` | — |
| 3 | getMessages 확장 | `src/lib/messages.ts` | #2 |
| 4 | useTranslation 훅 생성 | `src/hooks/useTranslation.ts` | #2 |
| 5 | ChatRoomClient 번역 통합 | `src/app/(main)/messages/[id]/ChatRoomClient.tsx` | #2, #3, #4 |
| 6 | Server page에 myLang 전달 | `src/app/(main)/messages/[id]/page.tsx` | #5 |
| 7 | 새 대화 페이지 생성 | `src/app/(main)/messages/new/[designerId]/page.tsx` | #1, #2 |
| 8 | /chat 라우트 삭제 | `src/app/(main)/chat/` (전체) | #5, #7 |
| 9 | 미사용 파일 삭제 | `src/hooks/useChat.ts`, `src/components/chat/MessageBubble.tsx`, `src/components/chat/MessageInput.tsx` | #8 |
| 10 | 기타 미사용 컴포넌트 정리 | `src/components/chat/RecentChatItem.tsx` 등 | #9 |
| 11 | 잔여 참조 정리 | grep으로 `/chat` 참조 0 확인 | #10 |

### 11.2 Key Implementation Details

#### useTranslation 핵심 로직

```typescript
// 1. messages가 변경될 때마다 번역 필요한 메시지 필터링
// 2. content_translated[myLang]이 이미 있으면 → translations Map에 저장 (캐시 히트)
// 3. 없으면 → translating Set에 추가 → /api/translate 호출
// 4. 번역 완료 → translations Map 업데이트 + DB content_translated 업데이트
// 5. 실패 → translating Set에서 제거 (원문 표시)
```

#### ChatRoomClient 번역 토글 UI

```typescript
// DesignerBubble에 추가할 UI:
// 1. isTranslating(msg.id) → "번역 중..." (pulse 애니메이션)
// 2. translation 존재 → 번역 텍스트 표시 + "원문 보기" 버튼
// 3. showOriginal 토글 → 원문 ↔ 번역 전환
// 4. MyBubble에는 번역 불필요 (내가 보낸 메시지)
```

#### handleSend sender_lang 추가

```typescript
// ChatRoomClient.handleSend 수정:
// content 외에 sender_lang 필드 추가
await supabase.from("message").insert({
  conversation_id: conversation.id,
  sender_id: currentUserId,
  content: text,
  sender_lang: myLang,  // 추가
});
```

#### messages/[id]/page.tsx myLang 전달

```typescript
// Server component에서 사용자 언어 조회
const { data: profile } = await supabase
  .from("onboarding_profiles")
  .select("languages")
  .eq("user_id", user.id)
  .maybeSingle();
const myLang = (profile?.languages as string[])?.[0] ?? "en";

// ChatRoomClient에 myLang prop 전달
<ChatRoomClient
  conversation={conversation}
  initialMessages={messages}
  currentUserId={user.id}
  myLang={myLang}           // 추가
/>
```

### 11.3 Session Guide

#### Module Map

| Module | Scope | Files | Dependencies |
|--------|-------|-------|-------------|
| **module-1** | DB + 타입 | migrations(2), types/message.ts | — |
| **module-2** | 번역 시스템 | hooks/useTranslation.ts, lib/messages.ts | module-1 |
| **module-3** | ChatRoomClient 통합 | ChatRoomClient.tsx, messages/[id]/page.tsx | module-1, module-2 |
| **module-4** | 새 대화 페이지 | messages/new/[designerId]/page.tsx | module-1 |
| **module-5** | 정리 (삭제) | chat/ 삭제, useChat 삭제, 미사용 컴포넌트 삭제 | module-3, module-4 |

#### Recommended Session Plan

| Session | Modules | 예상 작업 |
|---------|---------|---------|
| Session 1 | module-1 + module-2 | DB 마이그레이션 + 타입 확장 + useTranslation 훅 |
| Session 2 | module-3 | ChatRoomClient 번역 통합 + 서버 페이지 수정 |
| Session 3 | module-4 + module-5 | 새 대화 페이지 + /chat 삭제 + 정리 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-26 | Initial draft — Option C (Pragmatic Balance) | syk |
