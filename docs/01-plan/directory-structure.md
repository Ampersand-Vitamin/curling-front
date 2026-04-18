# Curling Front — Directory Structure

> **Created**: 2026-04-18
> **Based on**: IA (Information Architecture) Figma
> **Status**: Draft

---

## 1. 설계 원칙

- **IA 탭 = App Router 라우트**: Discover, Style, Message, My가 각각 `/discover`, `/style`, `/message`, `/my` 라우트
- **features/ = 도메인 로직**: 탭과 무관한 비즈니스 로직은 `features/` 에 도메인별로 분리
- **components/ = 공유 UI**: 2개 이상의 feature에서 사용하는 컴포넌트
- **Colocation**: 특정 라우트에서만 쓰이는 컴포넌트는 해당 라우트 폴더 내 `components/`에 배치

---

## 2. 디렉토리 구조

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (font, providers)
│   ├── page.tsx                  # Landing → /discover redirect
│   ├── globals.css               # Design tokens (color)
│   │
│   ├── discover/                 # 탭 1: Discover
│   │   ├── page.tsx              # Discover 메인 (맵뷰 + 리스트)
│   │   ├── components/
│   │   │   ├── MapView.tsx       # 지도 뷰
│   │   │   ├── DesignerCard.tsx  # 디자이너 카드
│   │   │   ├── DesignerCarousel.tsx
│   │   │   ├── KeywordFilter.tsx # 필터 칩
│   │   │   ├── ViewToggle.tsx    # 맵/리스트 토글
│   │   │   ├── PullBar.tsx       # 바텀시트 풀바
│   │   │   └── LanguageTag.tsx
│   │   ├── search/               # 검색 (Text Search, Filter Search)
│   │   │   └── page.tsx
│   │   ├── salon/
│   │   │   └── [salonId]/
│   │   │       └── page.tsx      # 살롱 상세 (Featured Salon)
│   │   ├── designer/
│   │   │   └── [designerId]/
│   │   │       └── page.tsx      # 디자이너 상세 프로필
│   │   └── article/
│   │       ├── page.tsx           # 아티클/가이드 목록
│   │       └── [slug]/
│   │           └── page.tsx       # 아티클 상세
│   │
│   ├── style/                    # 탭 2: Style
│   │   ├── page.tsx              # Style Finder 메인
│   │   ├── components/
│   │   │   ├── StyleFinder.tsx   # 스타일 검색 UI
│   │   │   ├── ImageSearch.tsx   # 이미지 기반 검색
│   │   │   └── SimilarStyles.tsx # 유사 스타일 추천
│   │   ├── search/
│   │   │   └── page.tsx          # 스타일 검색 결과
│   │   ├── favorites/
│   │   │   └── page.tsx          # 찜한 스타일
│   │   └── dictionary/
│   │       └── page.tsx          # Term Difference Dictionary
│   │
│   ├── message/                  # 탭 3: Message
│   │   ├── page.tsx              # 채팅방 목록
│   │   ├── components/
│   │   │   ├── ChatRoom.tsx      # 채팅방 UI
│   │   │   ├── MessageBubble.tsx # 메시지 버블
│   │   │   └── ReferenceImagePicker.tsx  # 레퍼런스 이미지 공유
│   │   └── [roomId]/
│   │       └── page.tsx          # 채팅방 상세
│   │
│   ├── my/                       # 탭 4: My
│   │   ├── page.tsx              # 마이 페이지 메인
│   │   ├── components/
│   │   │   └── HairProfileForm.tsx  # 헤어 프로필 입력 폼
│   │   ├── hair-profile/
│   │   │   └── page.tsx          # My Hair Profile
│   │   └── settings/
│   │       └── page.tsx          # 설정
│   │
│   └── (auth)/                   # Auth 그룹 (레이아웃 공유)
│       ├── login/
│       │   └── page.tsx
│       └── signup/
│           └── page.tsx
│
├── components/                   # 공유 UI 컴포넌트
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── BottomSheet.tsx
│       ├── Tab.tsx
│       ├── BottomNav.tsx         # 하단 탭 네비게이션
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       └── Skeleton.tsx
│
├── features/                     # 도메인별 비즈니스 로직
│   ├── designer/                 # 디자이너 관련
│   │   ├── types.ts              # DesignerProfile, Portfolio 타입
│   │   ├── api.ts                # 디자이너 API 호출
│   │   └── hooks.ts              # useDesigner, useDesignerList
│   ├── salon/                    # 살롱 관련
│   │   ├── types.ts
│   │   ├── api.ts
│   │   └── hooks.ts
│   ├── style/                    # 스타일 관련
│   │   ├── types.ts              # StyleTag, TermDictionary 타입
│   │   ├── api.ts
│   │   └── hooks.ts
│   ├── chat/                     # 채팅 관련
│   │   ├── types.ts              # ChatRoom, ChatMessage 타입
│   │   ├── api.ts
│   │   └── hooks.ts
│   ├── user/                     # 유저/인증 관련
│   │   ├── types.ts              # User, HairProfile 타입
│   │   ├── api.ts
│   │   └── hooks.ts
│   └── article/                  # 아티클/가이드
│       ├── types.ts
│       ├── api.ts
│       └── hooks.ts
│
├── store/                        # Zustand stores
│   ├── useMapStore.ts            # 지도 상태 (중심좌표, 줌)
│   ├── useFilterStore.ts         # 필터/검색 상태
│   ├── useAuthStore.ts           # 인증 상태
│   └── useChatStore.ts           # 채팅 실시간 상태
│
├── lib/                          # 유틸리티
│   ├── api.ts                    # API client (fetch wrapper)
│   ├── constants.ts              # 상수
│   └── utils.ts                  # 공통 헬퍼
│
├── styles/                       # 스타일
│   └── typography.css            # Typography tokens
│
├── types/                        # 공유 타입
│   └── common.ts                 # 공통 타입 (Pagination, ApiResponse 등)
│
├── messages/                     # i18n
│   ├── ko.json
│   └── en.json
│
└── stories/                      # Storybook
    ├── DesignerCard.stories.tsx
    ├── KeywordFilter.stories.tsx
    ├── PullBar.stories.tsx
    └── ...
```

---

## 3. IA ↔ 디렉토리 매핑

| IA 탭 | 라우트 | features/ | store/ |
|-------|--------|-----------|--------|
| **Discover** | `/discover/**` | `designer/`, `salon/`, `article/` | `useMapStore`, `useFilterStore` |
| **Style** | `/style/**` | `style/`, `designer/` | `useFilterStore` |
| **Message** | `/message/**` | `chat/` | `useChatStore` |
| **My** | `/my/**` | `user/` | `useAuthStore` |

---

## 4. IA 상세 기능 ↔ 파일 매핑

### Discover

| IA 기능 | 파일 |
|---------|------|
| Search (Text/Filter) | `app/discover/search/page.tsx` |
| Map view | `app/discover/components/MapView.tsx` |
| Designer/Salon mode switch | `app/discover/components/ViewToggle.tsx` |
| Recommended Salon/Designer | `features/designer/api.ts` (추천 API) |
| Search Result | `app/discover/search/page.tsx` |
| Best Match / Nearest | `features/designer/api.ts` (정렬 로직) |
| Featured Salon | `app/discover/salon/[salonId]/page.tsx` |
| Article/guide | `app/discover/article/**` |

### Style

| IA 기능 | 파일 |
|---------|------|
| Style Finder | `app/style/components/StyleFinder.tsx` |
| Image Search | `app/style/components/ImageSearch.tsx` |
| Portfolio Images | `features/designer/types.ts` (Portfolio) |
| Similar styles | `app/style/components/SimilarStyles.tsx` |
| Search Result / Favorites | `app/style/search/`, `app/style/favorites/` |
| Term Difference Dictionary | `app/style/dictionary/page.tsx` |
| Translation | i18n (`messages/ko.json`, `messages/en.json`) |

### Message

| IA 기능 | 파일 |
|---------|------|
| Chat with Designers | `app/message/[roomId]/page.tsx` |
| Reference Image Sharing | `app/message/components/ReferenceImagePicker.tsx` |
| Translation | i18n |

### My

| IA 기능 | 파일 |
|---------|------|
| Login/out | `app/(auth)/login/`, `features/user/api.ts` |
| My Hair Profile | `app/my/hair-profile/page.tsx` |
| Setting | `app/my/settings/page.tsx` |

---

## 5. Entity ↔ Feature 매핑

| ERD Entity | features/ 모듈 |
|-----------|----------------|
| User, HairProfile | `features/user/` |
| DesignerProfile | `features/designer/` |
| Salon | `features/salon/` |
| Portfolio | `features/designer/` |
| KeywordCategory, Keyword | `features/designer/` (필터) |
| Favorite | `features/designer/` |
| Article | `features/article/` |
| StyleTag, PortfolioStyleTag | `features/style/` |
| TermDictionary | `features/style/` |
| ChatRoom, ChatMessage | `features/chat/` |
| Service, Booking, Review | Phase 4에서 추가 |
