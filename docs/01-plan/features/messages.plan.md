# messages Planning Document

> **Summary**: `/messages` 인박스 + `/messages/[threadId]` 1:1 채팅 라우트를 static placeholder 수준으로 신설. designer detail 메시지 아이콘이 도착할 곳을 만들고, 후속 PDCA에서 thread 데이터/전송/realtime을 단계적으로 확장할 베이스를 제공한다.
>
> **Project**: curling-front
> **Version**: 0.1.0
> **Author**: syk
> **Date**: 2026-04-25
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | (1) designer detail의 메시지 아이콘이 갈 곳이 없어 클릭 시 404 위험. (2) BottomNav `Messages` 탭이 활성 가능한 라우트 없이 노출되어 있다. |
| **Solution** | `/messages` (인박스 빈 안내) + `/messages/[threadId]` (designer fetch + DetailHeader 재사용 + "준비 중") 두 라우트 신설. 모든 데이터/전송 미구현, 진입점·헤더·인박스 셸만 완성. |
| **Function/UX Effect** | designer detail → 메시지 아이콘 → 동일 디자이너 정보 헤더의 채팅 placeholder 진입. BottomNav Messages 탭이 두 라우트에서 active. 인박스 진입 시 빈 상태 안내. |
| **Core Value** | UI/UX 동선 완성. 후속 PDCA에서 thread 모델 → 전송 → realtime 순으로 안전하게 적층할 수 있는 라우트·헤더 베이스 확보. |

---

## Context Anchor

> Auto-generated from Executive Summary. Propagated to Design/Do documents for context continuity.

| Key | Value |
|-----|-------|
| **WHY** | designer detail에 메시지 진입점은 생겼지만 도착 라우트가 없음. BottomNav Messages 탭도 빈 라우트. 라우트·헤더 셸을 먼저 깔아 후속 데이터 작업이 동선 깨짐 없이 적층되도록 한다. |
| **WHO** | (1) designer detail에서 메시지 아이콘을 누르는 고객, (2) BottomNav Messages 탭으로 인박스를 열어보는 고객. |
| **RISK** | (1) DetailHeader를 designer-specific 위치에서 공유 위치로 이동하면 designer detail 측 import 경로가 깨질 수 있음. (2) `threadId = designer.id` 가정이 추후 그룹 채팅/멀티 thread 도입 시 깨질 위험. (3) BottomNav active 로직(`pathname.startsWith("/messages")`)이 동적 세그먼트에서도 의도대로 동작하는지 검증 필요. |
| **SUCCESS** | (a) `/messages` 진입 → 빈 상태 안내. (b) designer detail → 메시지 아이콘 → `/messages/{designer.id}` → DetailHeader에 동일 designer 정보 + 본문 "준비 중". (c) 두 라우트 모두 BottomNav Messages 탭 active. (d) designer detail 페이지가 회귀 없이 그대로 동작. |
| **SCOPE** | IN: `/messages/page.tsx`, `/messages/[threadId]/page.tsx`, DetailHeader 공유 위치 이동 + props 확장(messageHref optional), designer detail import 경로 업데이트. OUT: thread/message 데이터 모델, 메시지 전송, mock thread 카드 리스트, realtime/WebSocket, push notification, file/image 첨부, auth/현재 사용자 개념. |

---

## 1. Overview

### 1.1 Purpose

직전 PDCA(`designer-detail`)에서 디자이너 상세 헤더 우측에 메시지 아이콘을 배치했으나 도착 라우트(`/messages/[threadId]`)가 존재하지 않는다. 또한 BottomNav의 `Messages` 탭은 항상 노출되지만 클릭 시 `/messages` 라우트가 없어 404 위험이 있다. 본 PDCA는 두 라우트의 **셸(shell)** 만 우선 깔아 동선과 active 상태를 닫고, 실 데이터/전송 기능은 후속 PDCA로 분리한다.

### 1.2 Background

- 직전 작업에서 `DetailHeader`(`src/app/(main)/designer/[designerId]/components/DetailHeader/index.tsx`)는 `← + 디자이너 프로필/이름/살롱 + 메시지 아이콘` 형태로 완성됨.
- 사용자 결정: 메시지 아이콘 클릭 시 글로벌 `/messages/[threadId]` 라우트로 이동, 인박스(`/messages`)도 함께 운영. 향후 1:1 채팅 thread를 메시지함에서 모아볼 수 있어야 함.
- `BottomNav` (`src/components/ui/BottomNav.tsx`)는 `pathname.startsWith(item.href)` 로 active를 판단하므로 `/messages` 또는 `/messages/[id]` 양쪽에서 자연 active.

### 1.3 Related Documents

- 직전 PDCA: [`docs/02-design/features/designer-detail.design.md`](../../02-design/features/designer-detail.design.md)
- 디자인 토큰: `src/app/globals.css`, `src/styles/typography.css` (CLAUDE.md 참조)

---

## 2. Scope

### 2.1 In Scope

- [ ] `/messages` 라우트 신설 — 빈 상태 안내(empty state) 1개 UI
- [ ] `/messages/[threadId]` 라우트 신설 — `threadId`를 designer ID로 간주, `getDesignerById()` 호출, 상단 DetailHeader, 본문 "준비 중" placeholder
- [ ] `DetailHeader` 컴포넌트를 designer-specific 위치 → 공유 위치로 이동(정확한 경로는 Design 단계에서 결정)
- [ ] `DetailHeader` props 확장: `messageHref`를 optional로 — thread 페이지에서는 우측 메시지 아이콘 미표시
- [ ] `DesignerDetailClient.tsx`의 `DetailHeader` import 경로 업데이트
- [ ] 두 라우트 모두 `(main)` 그룹 layout 하위에 배치하여 BottomNav 노출 + active 동작 검증

### 2.2 Out of Scope

- thread/message DB 스키마 및 마이그레이션
- 메시지 전송 UI (input/composer), 로컬 state 메시지 처리도 제외
- 인박스의 더미 thread 카드 리스트 (이번 PDCA는 empty state 1개)
- realtime / WebSocket / 폴링
- 푸시 알림, 파일·이미지 첨부, 읽음 처리, 타이핑 인디케이터
- 인증·현재 사용자 개념(현재 프로젝트에 없음). thread 소유권 검증 없음.
- 그룹 채팅, 다중 참여자 thread

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `/messages` 페이지가 BottomNav Messages 탭에서 진입 시 빈 상태 안내(아이콘/문구)를 표시한다. | High | Pending |
| FR-02 | `/messages/[threadId]` 페이지는 `threadId`를 designer ID로 간주, `getDesignerById(threadId)` 호출. 결과가 `null`이면 `notFound()`. | High | Pending |
| FR-03 | thread 페이지 상단에 `DetailHeader`를 사용하여 designer detail과 동일한 좌측(← + 프로필 + 이름/살롱) UI를 표시한다. 우측 메시지 아이콘은 표시하지 않는다. | High | Pending |
| FR-04 | thread 페이지 본문은 "곧 준비될 예정입니다" 류의 안내 placeholder로 채운다. | High | Pending |
| FR-05 | `DetailHeader` 컴포넌트를 공유 위치로 이동한다. designer detail의 import 경로를 동시에 업데이트하여 회귀 0. | High | Pending |
| FR-06 | `DetailHeader`의 `messageHref` prop을 optional로 변경한다. 값이 없으면 우측 영역을 비워둔다(또는 동일 폭 spacer 유지). | High | Pending |
| FR-07 | 두 라우트 모두 `(main)` 그룹 layout 하위에 배치되어 BottomNav가 표시되고 `Messages` 탭이 active 처리된다. | High | Pending |
| FR-08 | designer detail의 메시지 아이콘 링크(`/messages/${designer.id}`)가 그대로 정상 동작한다(회귀 검증). | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | thread 페이지의 designer fetch는 기존 `getDesignerById()` 단일 쿼리로 제한 | 코드 리뷰 |
| Accessibility | 빈 상태 안내에 의미 있는 텍스트, 아이콘 `aria-hidden`. `← 뒤로가기` 버튼은 `aria-label` 유지. | 수동 점검 |
| Visual Consistency | DetailHeader 토큰 그대로(`bg-surface-50`, `typo-h6`, `typo-caption2`). 임의 색·폰트 금지(CLAUDE.md). | 수동 점검 |
| 모바일 우선 | 모든 신규 화면이 390px 폭 기준으로 정상 렌더 | 브라우저 수동 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `/messages`, `/messages/[threadId]` 두 페이지가 404 없이 진입
- [ ] designer detail 메시지 아이콘 → thread 페이지 → 같은 designer 정보 헤더 표시
- [ ] BottomNav Messages 탭이 두 라우트에서 active
- [ ] designer detail 페이지가 그대로 동작(회귀 없음)
- [ ] DetailHeader가 공유 위치에서 designer detail/thread 양쪽에 import되어 정상 렌더

### 4.2 Quality Criteria

- [ ] Zero lint errors (`pnpm lint`)
- [ ] TypeScript strict 통과
- [ ] CLAUDE.md 디자인 토큰 규칙 준수 (하드코딩 색·폰트 금지)
- [ ] PR 1개로 머지 가능한 작은 변경 폭

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `DetailHeader` 공유 위치 이동 시 designer detail import 경로 누락 | Medium | Medium | 이동과 동시에 `DesignerDetailClient.tsx` import 라인을 같은 커밋에서 수정. grep으로 잔여 경로 0 확인. |
| `threadId = designer.id` 가정이 향후 그룹 채팅/멀티 thread 도입 시 깨짐 | Medium | Low (현재 단계) | placeholder 단계에서는 코드 코멘트로 가정 명시. 후속 PDCA에서 thread 모델 도입 시 `getThreadById` 추상화로 교체. Design에서 매핑 함수 자리 마련. |
| BottomNav `startsWith` 가 `/messages` 외 라우트(예: `/messages-archive`)와 충돌 | Low | Very Low | 본 PDCA에선 신규 라우트 없으므로 위험 미미. 후속 라우트 추가 시 정확한 경로 매칭으로 보강. |
| thread 페이지 우측 영역 비워두면 좌우 균형이 깨져 헤더가 어색해 보임 | Low | Medium | spacer로 동일 폭(40px) 유지하거나, 우측에 `… 더보기` 같은 자리 표시자(no-op). Design에서 결정. |
| 빈 인박스 안내가 실제 사용자에게 "고장난 페이지"로 오인 | Low | Low | 친근한 문구 + 아이콘. CTA(예: "디자이너 둘러보기 →") 검토(선택). Design에서 결정. |
| Messages 라우트 신설로 SafeImage·storageUrl 의존성 누설 | Low | Low | 공유 DetailHeader 이동 시 import 경로만 정리. 신규 의존성 없음. |

---

## 6. Impact Analysis

> 변경되는 자원과 그 자원의 모든 현재 소비자를 사전 인벤토리.

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `DetailHeader` 컴포넌트 | UI Component | designer-specific 디렉토리에서 공유 디렉토리로 **이동**. props에 `messageHref` optional 변경(또는 우측 슬롯 추상화). |
| App Router 라우트 트리 | Routing | `src/app/(main)/messages/page.tsx`, `src/app/(main)/messages/[threadId]/page.tsx` **신설**. |
| `DesignerDetailClient.tsx` | Client Component | `DetailHeader` import 경로 **수정**. (props 시그니처 변경에 따라 호출부 수정 가능성) |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `DetailHeader` | import + render | `src/app/(main)/designer/[designerId]/DesignerDetailClient.tsx` | 경로/시그니처 동시 업데이트 필요 (Breaking → 같은 커밋에서 해결) |
| `getDesignerById` | call | (기존) `src/app/(main)/designer/[designerId]/page.tsx` | 변경 없음. thread 페이지가 같은 함수를 새로 호출하는 추가 소비자가 됨. |
| `BottomNav` Messages item href | navigation | `src/components/ui/BottomNav.tsx` (`/messages`) | 라우트가 실제로 존재하게 되면서 정상 active. 코드 변경 불필요. |
| `(main)/layout.tsx` | layout wrap | (기존) discover/designer 라우트 감쌈 | messages 라우트도 동일 layout에 자동 포함 (App Router 그룹 동작). |

### 6.3 Verification

- [ ] `DetailHeader` 공유 위치 이동 후 grep으로 옛 경로 import 0
- [ ] designer detail 페이지 진입 → 헤더 정상 렌더 + 메시지 아이콘 동작
- [ ] thread 페이지 진입 → 동일 헤더 + designer 정보 정상 표시
- [ ] designer detail에서 메시지 아이콘 클릭 → URL `/messages/{designer.id}` → 헤더에 같은 designer
- [ ] BottomNav Messages 탭 → `/messages` 진입 → 빈 상태 표시 + 탭 active 유지
- [ ] thread URL 직접 진입 시에도 BottomNav Messages 탭 active
- [ ] 잘못된 threadId 진입 시 404 (Next.js notFound)

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure (`components/`, `lib/`, `types/`) | Static sites, portfolios, landing pages | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend, SaaS MVPs, fullstack apps | ☑ |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems, complex architectures | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Routing | Pages Router / App Router | App Router | 프로젝트 표준. `(main)` 그룹 layout으로 BottomNav 자동 포함. |
| `DetailHeader` 위치 | `src/app/(main)/designer/...`(현재) / `src/components/...`(공유) | **공유** | messages thread에서도 재사용 필요. designer-specific 의미는 props로 표현. 정확한 경로/이름은 Design 단계 3개 옵션으로 비교. |
| `DetailHeader` 우측 슬롯 | (a) `messageHref` optional → 없으면 빈 영역 / (b) `rightSlot?: ReactNode` 일반화 | **Design에서 결정** | (a)가 단순. (b)가 확장성. 본 PDCA 범위(placeholder)에서는 (a)로 충분 가능. |
| `threadId` 모델 | designer.id 직접 / 별도 thread 모델 | **designer.id 직접 (placeholder)** | 후속 PDCA에서 thread 모델 도입 시 매핑 레이어로 교체. 코드 코멘트로 가정 명시. |
| 데이터 fetch | server component fetch / client useEffect | **Server Component** | designer detail 패턴 답습. thread 페이지는 `params.threadId` → `getDesignerById` → `notFound()`. |
| Styling | Tailwind / CSS Modules | Tailwind | 프로젝트 표준. CLAUDE.md 디자인 토큰 강제. |
| State Management | 없음 (placeholder) | — | 본 PDCA는 데이터 변형/상태 없음. |

### 7.3 Folder Structure Preview

```
src/
  app/
    (main)/
      messages/
        page.tsx                    # 인박스 (empty state)
        [threadId]/
          page.tsx                  # designer fetch + 404 처리
          ChatPlaceholder.tsx       # (선택) 본문 placeholder 분리
      designer/[designerId]/...      # 그대로
  components/
    {DetailHeader 새 위치}/         # Design에서 정확한 경로 결정
      index.tsx                     # messageHref optional
```

### 7.4 Future Architecture (Out of Current Scope)

> 본 PDCA는 placeholder만 다루지만, 후속 PDCA가 라우트·헤더 셸을 깨지 않고 적층할 수 있도록 **방향만 합의**한다. 아래 결정은 본 PDCA에서 구현/스키마 변경을 유발하지 않는다.

**(a) URL 합의 — opaque threadId.**
`/messages/[threadId]`의 `threadId`는 클라이언트 입장에서 **opaque**(불투명) 식별자로만 다룬다. 본 PDCA에서는 편의상 `threadId = designer.id`로 가정하지만, 후속 PDCA에서 thread 모델을 도입할 때 라우트는 그대로 두고 **resolver 함수만 교체**(`getDesignerById(threadId)` → `getThreadByIdOrCreate(threadId)`)한다. 외부 링크 호환성을 위해 라우트 구조는 변경하지 않는다.

**(b) Thread 데이터 모델 후보 (Design 단계에서 1개 선택).**

| 옵션 | 구조 | 장점 | 단점 |
|------|------|------|------|
| **B1. `threads` 테이블 + `messages` 테이블** | `threads(id, customer_id, designer_id, last_message_at, ...)` + `messages(id, thread_id, sender_id, content, created_at, ...)` | 그룹 채팅·메타데이터(읽음/타이핑) 확장 용이. threadId가 안정적 PK. | 테이블 2개 + 마이그레이션. customer 첫 진입 시 thread 생성 필요. |
| **B2. Pair-based deterministic ID + `messages`만** | `messages(id, sender_id, recipient_id, content, ...)`, threadId = `min(uid_a,uid_b):max(uid_a,uid_b)` 결정적 해시 | 테이블 1개. thread 생성 불필요. | 1:1 전제 고착. 그룹 채팅 도입 시 마이그레이션 큼. |
| **B3. `messages`만 + `conversation_id`** | `messages(id, conversation_id, sender_id, content, ...)`, conversation_id = (a,b) 정렬 결합 | B2와 유사하지만 명시적 컬럼. | B2의 트레이드오프와 동일. |

**기본 권장**: **B1** (그룹 채팅·읽음 처리 확장 여지). 단, 단기간 1:1만 보장된다면 B2도 유효.

**(c) Realtime 후보 (Design 단계에서 1개 선택).**

| 옵션 | 메커니즘 | 장점 | 단점 |
|------|---------|------|------|
| **R1. Supabase Realtime** | Postgres `messages` 테이블 변경 구독 (WebSocket) | 인프라 추가 0(이미 Supabase 사용). 양방향. | RLS 정책 정밀 설계 필요. |
| **R2. Polling / focus refresh** | thread 진입·포커스 시 fetch | 가장 단순. | UX 즉시성 낮음. 부하 존재. |
| **R3. SSE / 별도 WebSocket 서버** | 커스텀 서버 | 유연. | 인프라 추가. 운영 부담. |

**기본 권장**: **R1**(Supabase Realtime). MVP 빠르게 가야 한다면 **R2**부터 시작 후 R1으로 점진 마이그레이션.

**(d) 본 PDCA 호환성 보증.**
위 어느 조합(B1·B2·B3 × R1·R2·R3)을 골라도 본 PDCA의 산출물(`/messages` empty state, `/messages/[threadId]` 셸, 공유 DetailHeader)은 **수정 없이 재사용** 가능하다. 후속 PDCA는 (1) 데이터 fetch 함수 교체, (2) 본문 placeholder를 메시지 리스트/composer로 교체, (3) realtime 구독 추가만 수행한다.

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] `CLAUDE.md` 코딩 컨벤션 + 디자인 토큰 규칙 명시
- [x] `tsconfig.json` strict
- [x] ESLint 설정
- [x] Tailwind v4 + 토큰 기반 색·폰트 시스템 (`globals.css`, `typography.css`)
- [x] 이전 PDCA(designer-detail) 디자인 문서가 컴포넌트 폴더 구조 패턴 정의

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **공유 컴포넌트 위치** | `src/components/`, `src/components/ui/` 두 위치 혼재 | Design에서 DetailHeader 새 위치/이름을 명확히 결정 | High |
| **placeholder 컴포넌트 패턴** | 없음 | "Coming soon" 문구·아이콘 일관 패턴 (재사용 시 별도 컴포넌트화 검토) | Low |

### 8.3 Environment Variables Needed

신규 환경 변수 없음.

---

## 9. Next Steps

1. [ ] `/pdca design messages` — 3개 아키텍처 옵션 비교(특히 DetailHeader 새 위치/이름, 우측 슬롯 처리 방식)
2. [ ] Design 승인 후 `/pdca do messages`
3. [ ] designer detail 회귀 수동 검증 포함

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-25 | Initial draft | syk |
| 0.2 | 2026-04-25 | §7.4 Future Architecture 추가 — opaque threadId 합의 + thread 모델 3안 + realtime 3안 + 호환성 보증 | syk |
