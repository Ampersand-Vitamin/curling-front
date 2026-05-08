# Designer Detail — Design Document

> **Created**: 2026-04-25
> **Status**: Draft
> **Feature**: designer-detail
> **Phase**: Design
> **Architecture**: **Option B — Clean Architecture (Per-Section Folders + Custom Hooks + Domain Layer + Mocks Directory)**
> **Plan**: [`../../01-plan/features/designer-detail.plan.md`](../../01-plan/features/designer-detail.plan.md)
> **Figma Ref**: [node 363:11455](https://www.figma.com/design/1EccDx1qvrkFZBsNEFbWjj/Batch1_Design?node-id=363-11455)

---

## Context Anchor

> Plan에서 승계. 세션 간 의사결정 컨텍스트 유지.

| 항목 | 내용 |
|------|------|
| **WHY** | Discover 탭에서 디자이너 카드 클릭 → 상세 이동이 끊겨 있음. Figma의 풀 프로필 스펙(363:11455)을 라우트/데이터/UI 3단으로 구현해 "탐색→선택" 플로우를 완성. |
| **WHO** | Discover 캐러셀에서 디자이너를 선택하려는 고객. (맵 핀 클릭 진입은 다음 PDCA로 분리) |
| **RISK** | (1) `DesignerCarousel` mock→DB 전환 시 정렬 로직 부재, (2) 신규 컬럼 추가로 시드 재실행 필요, (3) 탭 클라 상태로만 처리 시 딥링크 불가(의도), (4) 실 이미지 파일 부재 시 깨짐, (5) Mock Services/Reviews가 모든 디자이너에 동일 노출. |
| **SUCCESS** | `DesignerCarousel` 카드 클릭 → `/designer/{uuid}` 이동. Figma 363:11455와 섹션 구조 일치. 뒤로가기 시 Discover 원위치. 탭 즉시 반응. 키워드/언어/포트폴리오가 실 DB. |
| **SCOPE** | IN: `/designer/[designerId]` 라우트 + 10개 섹션 + DB 스키마 확장(media + display_name + role) + 시드 + `DesignerCarousel` DB 연동 + 카드 Link. OUT: 맵 핀 이동, Salon Detail, Services/Review/Favorite DB, Auth, 'Best Match' 알고리즘, i18n. |

---

## 1. Overview

본 설계는 **Option B — Clean Architecture** 를 채택한다. 핵심:

- **섹션별 폴더 분리** (`components/{Section}/index.tsx`) — 각 폴더가 자체 hook/util 둘 자리 보장
- **커스텀 Hook 분리** (`hooks/useDesignerTabs`, `hooks/useFavoriteToggle`) — 추후 URL 동기화 / favorite 테이블 도입 시 **단일 교체 지점**
- **도메인 디렉토리화** (`src/lib/designers/{queries,list,types,index}.ts`) — 기존 단일 `designers.ts` 파일을 폴더로 승격하면서 `getDesignerMapItems`(MapView 사용 중)도 함께 이전
- **Mock 분리** (`src/mocks/designer-{services,reviews}.ts`) — 향후 실 테이블 도입 시 import 경로 1줄 교체
- **Server Component** `page.tsx`가 단일 진입점에서 모든 fetch (designer + salon + keywords)
- **Client orchestrator** `DesignerDetailClient.tsx`는 탭/북마크 hook 호출 + 섹션 렌더만 담당
- **타입 단일화**: `src/lib/designers/types.ts`에 도메인 모델, snake_case Raw 행은 `queries.ts` 내부 private

---

## 2. Architecture

### 2.1 Layer Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  DB Layer (Supabase)                                              │
│  designer_profile  ──▶  +profile_image_url, +portfolio_images,    │
│                          +display_name, +role  (Migration)         │
│  salon, keyword, keyword_category, designer_keyword                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  Domain Layer  (src/lib/designers/)                               │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ types.ts     │  │ queries.ts        │  │ list.ts            │ │
│  │ DesignerDetail│ │ getDesignerById   │  │ getBestMatch...    │ │
│  │ DesignerKeyword│ │ (1 record + JOIN) │  │ getDesignerMap...  │ │
│  │ DesignerListItem│ │ Raw row → domain │  │ (carousel + map)   │ │
│  └──────────────┘  └──────────────────┘  └────────────────────┘ │
│  index.ts (re-export, public surface)                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │ (Server Component fetch)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  Page Layer                                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ app/(main)/designer/[designerId]/page.tsx  (Server)         │  │
│  │  - params.designerId → getDesignerById()                    │  │
│  │  - notFound() if null                                       │  │
│  │  - props → DesignerDetailClient                              │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│                               ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ DesignerDetailClient.tsx  (Client orchestrator)             │  │
│  │  - useDesignerTabs() → activeTab                            │  │
│  │  - useFavoriteToggle() → isFavorite, toggle                 │  │
│  │  - render sections by tab                                   │  │
│  └────────┬─────────────────────────┬─────────────────────────┘  │
└───────────┼─────────────────────────┼────────────────────────────┘
            │ Designer tab            │ Portfolio tab
            ▼                         ▼
  ┌──────────────────────┐  ┌──────────────────────┐
  │ DetailHeader         │  │ DetailHeader          │
  │ PortfolioHero        │  │ PortfolioGrid (full)  │
  │ DesignerInfoSection  │  │                       │
  │ HighlightBubble      │  │                       │
  │ ReservationSection   │  │                       │
  │ SpecialityChips      │  │                       │
  │ LanguageSection      │  │                       │
  │ PortfolioGrid (4↑)   │  │                       │
  │ ServicesList (Mock)  │  │                       │
  │ ReviewSection (Mock) │  │                       │
  └──────────────────────┘  └──────────────────────┘
            │                          │
            └────── shared by ─────────┘
                          ▼
              ┌──────────────────────┐
              │ KeywordFilter        │  (재사용, Speciality 칩)
              │ LanguageTag          │  (재사용, Language)
              │ DesignerCard         │  (재사용 X — 카드는 Discover만 사용)
              └──────────────────────┘
```

### 2.2 Decision Record

| ID | 결정 | 근거 |
|----|------|------|
| D-1~D-11 | (Plan에서 확정) | Plan §4 참조 |
| **DS-1** | `src/lib/designers.ts` 단일 파일 → **폴더 승격** (`src/lib/designers/{queries,list,types,index}.ts`) | Option B 핵심. `getDesignerMapItems`도 폴더 내 `list.ts`로 이전. import 경로는 `@/lib/designers` 그대로 유지(index.ts re-export) → MapView 호환 |
| **DS-2** | `display_name VARCHAR(60) NOT NULL` 컬럼 추가 (Plan §2.5 해소) | Auth 미도입 상태. `app_user` JOIN 옵션은 user 테이블 자체가 비어있어 불가. 시드는 30개 이름 풀(Joy, Sejin, Jay, Yuna, …)을 외래 ref 기준 cycling |
| **DS-3** | `role VARCHAR(30) NOT NULL DEFAULT 'Designer'` 컬럼 추가 (Plan §2.5 해소) | Designer/Apprentice/Stylist 등 분류용. `years_of_exp` 파생은 비결정적이라 명시 컬럼이 명확 |
| **DS-4** | `other_links` JSONB 스키마 합의: `{ message?: string, instagram?: string, whatsapp?: string, naver?: string }` (모든 값은 URL 또는 핸들). 시드는 디자이너별 1~3개 랜덤 채움 | Plan FR-09. JSONB라 추후 확장 자유. `message` 키는 임시(앱 내 채팅 도입 전까지 mailto: 또는 외부 메신저 URL) |
| **DS-5** | 라우트 그룹 디렉토리 폴더화: `(main)/designer/[designerId]/components/{Section}/index.tsx` | Option B의 콜로케이션. 섹션별 hook/utility(예: `PortfolioHero/useHeroCarousel.ts`)를 같은 폴더에 둘 수 있음 |
| **DS-6** | Carousel 라이브러리: `embla-carousel-react` 도입 | PortfolioHero(가로 스와이프 + 도트 인디케이터). `react-spring`이나 자체 구현 대비 모바일 제스처/접근성 검증된 표준 라이브러리. 번들 ~20KB |
| **DS-7** | `useDesignerTabs()` Hook은 **현재 useState** 기반, 시그니처는 `{ activeTab, setActiveTab, tabs }`로 향후 URL 동기화(useSearchParams) 교체 시 **컴포넌트 변경 없음** | Plan D-3. 클라 상태 시작, 추후 확장 여지 |
| **DS-8** | `useFavoriteToggle(designerId)` Hook은 **현재 useState** 기반, 시그니처는 `{ isFavorite, toggle, isLoading }`. 추후 favorite 테이블 + Auth 시 동일 시그니처로 supabase mutation 교체 | Plan D-7. UI-only 인터랙션을 hook으로 격리 → 교체 지점 명확 |
| **DS-9** | Server Component(`page.tsx`)는 fetch만 하고 layout에 관여하지 않음. 레이아웃(스크롤, 패딩)은 `DesignerDetailClient`가 보유 | Server는 데이터, Client는 UI 책임 분리. SSR 첫 페인트는 Client component의 fallback이 아닌 page.tsx의 즉시 렌더로 처리 |
| **DS-10** | `notFound()` 호출은 `page.tsx`에서 `getDesignerById()` 결과가 null일 때만. UUID 형식 invalid는 try-catch로 감싸 동일 처리 | Next.js 컨벤션. 커스텀 404 디자인은 별도 PDCA |
| **DS-11** | `MOCK_SERVICES`, `MOCK_REVIEWS`는 디자이너 ID에 따라 **2~3개 변형** 분기 (DesignerId 해시 mod N) | Plan 리스크 완화 — "모든 디자이너 동일 mock" 회피. 변형은 mocks/ 파일 내부에서 처리 |
| **DS-12** | 이미지 플레이스홀더: storage URL 404 시 `<img onError>`로 `asset/placeholder/{profile,portfolio}.svg` 교체 | 컴포넌트 레벨에서 처리(`SafeImage` 작은 wrapper). next/image 미사용 — remotePatterns 도입은 별도 PDCA |
| **DS-13** | `DesignerCarousel` 데이터: 부모 Server Component에서 `getBestMatchDesigners(limit=10)` 호출 후 props 전달 | Plan D-9. 정렬은 `created_at DESC` 임시. 추천 알고리즘은 별도 PDCA에서 함수 본문만 교체 |
| **DS-14** | Tab "Portfolio"는 `<PortfolioGrid columns={3} />` 등 컬럼 수만 prop으로 다르게 호출 (전용 컴포넌트 X) | Plan D-11. 본문 동일, 시각만 차이 |
| **DS-15** | Server query 결과에서 `created_at`/`updated_at` **drop** | Date 직렬화 이슈 차단. Client에 불필요 |

---

## 3. Data Model & Types

### 3.1 `src/lib/designers/types.ts` (신규)

```ts
// Public domain types (re-exported via index.ts)
// snake_case Raw 행 → camelCase 도메인으로 변환되어 노출됨

export type DesignerKeyword = {
  slug: string;
  name: string;
  categorySlug: string; // 'treatment' | 'languages' | 'hair_type' | 'special_offers'
};

/** 캐러셀/리스트용 경량 모델 */
export type DesignerListItem = {
  id: string;
  displayName: string;
  role: string;
  profileImageUrl: string | null;
  portfolioImages: string[];      // 최소 1개 권장 (Hero용)
  languages: string[];
  highlightMessage: string | null;
};

/** 디자이너 상세 페이지 전체 모델 */
export type DesignerDetail = {
  id: string;
  displayName: string;
  role: string;
  bio: string | null;
  highlightMessage: string | null;
  yearsOfExp: number | null;
  ratingAvg: number;
  reviewCount: number;
  isVerified: boolean;
  languages: string[];
  otherLinks: DesignerLinks;
  profileImageUrl: string | null;
  portfolioImages: string[];
  salon: { id: string; name: string; address: string | null } | null;
  keywords: DesignerKeyword[];
};

/** other_links JSONB shape (DS-4) */
export type DesignerLinks = {
  message?: string;
  instagram?: string;
  whatsapp?: string;
  naver?: string;
};

/** 지도 마커용 (기존 모델, list.ts로 이전) */
export type DesignerMapItem = {
  salonId: string;
  salonName: string;
  latitude: number;
  longitude: number;
  designerCount: number;
};
```

### 3.2 DB 쿼리 shape

`getDesignerById(id: string)` — supabase-js chain 2단계:

**Step 1**: 디자이너 본체 + 살롱
```ts
const { data, error } = await supabase
  .from('designer_profile')
  .select(`
    id, display_name, role, bio, highlight_message, years_of_exp,
    rating_avg, review_count, is_verified, languages, other_links,
    profile_image_url, portfolio_images,
    salon:salon_id ( id, name, address )
  `)
  .eq('id', id)
  .maybeSingle();
```

**Step 2**: 키워드 (별도 호출 — JSON aggregation 대비 가독성↑)
```ts
const { data: kwRows } = await supabase
  .from('designer_keyword')
  .select(`
    keyword:keyword_id (
      slug, name,
      category:category_id ( slug )
    )
  `)
  .eq('designer_id', id);
```

> 한 번의 RPC로 묶어도 되지만, supabase-js는 nested select가 직관적. RPC는 N>10 디자이너 일괄 조회 PDCA에서 검토.

**Step 3**: Raw → Domain 변환 (queries.ts 내 private fn)
```ts
function toDomain(raw, kwRows): DesignerDetail {
  return {
    id: raw.id,
    displayName: raw.display_name,
    role: raw.role,
    // ... camelCase 변환
    keywords: kwRows
      .filter(r => r.keyword)
      .map(r => ({
        slug: r.keyword.slug,
        name: r.keyword.name,
        categorySlug: r.keyword.category.slug,
      })),
  };
}
```

### 3.3 Migration: `20260424000001_add_designer_media.sql` (신규)

```sql
-- DS-2, DS-3 + Plan FR-18

ALTER TABLE public.designer_profile
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(60),  -- 일단 NULLABLE로 추가 후 시드, 마지막에 NOT NULL
  ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'Designer',
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

COMMENT ON COLUMN public.designer_profile.display_name IS '디자이너 표시명. Auth 도입 후 app_user 연결 시 user.name 동기화';
COMMENT ON COLUMN public.designer_profile.role IS '역할 분류 (Designer/Apprentice/Stylist/Barber 등)';
COMMENT ON COLUMN public.designer_profile.profile_image_url IS '프로필 썸네일 (storage 상대 경로)';
COMMENT ON COLUMN public.designer_profile.portfolio_images IS '포트폴리오 이미지 storage 경로 배열. [0]은 Hero 첫 슬라이드';
```

> **NOT NULL 시점**: 시드 갱신(40_designers.sql)에서 `display_name`을 채운 직후 별도 migration `20260424000002_designer_display_name_not_null.sql`로 `ALTER COLUMN ... SET NOT NULL`. **2개 마이그레이션으로 분리** — supabase의 멱등 reset 시 순서 보장.

### 3.4 Seed 수정: `supabase/seed/40_designers.sql`

기존 `INSERT INTO public.designer_profile (...)` VALUES 행에 4개 컬럼 추가:

```sql
-- 30개 이름 풀 (앞 30 designers)
WITH name_pool AS (
  SELECT name FROM (VALUES
    ('Joy'),('Sejin'),('Jay'),('Yuna'),('Mina'),
    ('Hana'),('Jiwoo'),('Soyeon'),('Aria'),('Luna'),
    ('Riley'),('Zoe'),('Maya'),('Ivy'),('Eden'),
    ('Sage'),('Bella'),('Chloe'),('Daisy'),('Ella'),
    ('Faith'),('Grace'),('Holly'),('Ines'),('Jade'),
    ('Kira'),('Lila'),('Nora'),('Olive'),('Piper')
  ) AS t(name)
)
-- 각 row: external_ref 끝 3자리 숫자 mod 30 으로 인덱스 산출하여 cycling
```

→ 정확한 SQL은 Do phase에서 작성. **현 시드 INSERT가 VALUES 단일 문**이므로 Do phase에서 컬럼별 expression(또는 Python 사전 처리)로 일괄 추가.

Storage URL 규칙:
- `profile_image_url = 'asset/designer/' || external_ref || '/profile.jpg'`
- `portfolio_images = ARRAY['asset/designer/' || external_ref || '/portfolio/1.jpg', '.../2.jpg', '.../3.jpg', '.../4.jpg']`

`other_links` 시드는 별도 UPDATE 문으로 일부 디자이너만 채움(공백/null 허용).

---

## 4. Module Design

### 4.1 `src/lib/designers/index.ts` (신규)

```ts
// Public surface — 외부는 이것만 import
export type {
  DesignerDetail,
  DesignerKeyword,
  DesignerListItem,
  DesignerLinks,
  DesignerMapItem,
} from './types';
export { getDesignerById } from './queries';
export { getBestMatchDesigners, getDesignerMapItems } from './list';
```

> 기존 `src/lib/designers.ts`는 **삭제**. 다른 곳에서 `from "@/lib/designers"` import는 그대로 동작 (Node module resolution: `designers.ts` → `designers/index.ts`).

### 4.2 `src/lib/designers/queries.ts` (신규)

```ts
import { supabase } from '@/lib/supabase';
import type { DesignerDetail, DesignerKeyword, DesignerLinks } from './types';

type RawDesigner = { /* snake_case 그대로, salon: {id, name, address} | null */ };
type RawKeywordRow = { keyword: { slug: string; name: string; category: { slug: string } } | null };

export async function getDesignerById(id: string): Promise<DesignerDetail | null> {
  // UUID 형식 검증 (invalid면 즉시 null → notFound)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }

  const [{ data: raw, error }, { data: kwRows, error: kwErr }] = await Promise.all([
    supabase.from('designer_profile').select(/* ... */).eq('id', id).maybeSingle(),
    supabase.from('designer_keyword').select(/* ... */).eq('designer_id', id),
  ]);

  if (error || kwErr || !raw) return null;
  return toDomain(raw as RawDesigner, (kwRows ?? []) as RawKeywordRow[]);
}

function toDomain(raw: RawDesigner, kwRows: RawKeywordRow[]): DesignerDetail { /* ... */ }
```

### 4.3 `src/lib/designers/list.ts` (신규)

```ts
import { supabase } from '@/lib/supabase';
import type { DesignerListItem, DesignerMapItem } from './types';

/** 캐러셀용. 정렬은 임시 created_at DESC. */
export async function getBestMatchDesigners(limit = 10): Promise<DesignerListItem[]> {
  const { data, error } = await supabase
    .from('designer_profile')
    .select('id, display_name, role, profile_image_url, portfolio_images, languages, highlight_message')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`[getBestMatchDesigners] ${error.message}`);
  // snake → camel
  return (data ?? []).map(r => ({ /* ... */ }));
}

/** MapView용 (기존 함수, 폴더로 이전) */
export async function getDesignerMapItems(): Promise<DesignerMapItem[]> {
  /* 기존 designers.ts 본문 그대로 */
}
```

### 4.4 `src/app/(main)/designer/[designerId]/page.tsx` (신규)

```tsx
// Server Component — fetch + notFound 처리
import { notFound } from 'next/navigation';
import { getDesignerById } from '@/lib/designers';
import DesignerDetailClient from './DesignerDetailClient';

export default async function DesignerDetailPage({
  params,
}: {
  params: Promise<{ designerId: string }>;
}) {
  const { designerId } = await params;
  const designer = await getDesignerById(designerId);
  if (!designer) notFound();
  return <DesignerDetailClient designer={designer} />;
}
```

> Next.js 16 App Router는 params가 Promise. `await params` 필수.

### 4.5 `src/app/(main)/designer/[designerId]/DesignerDetailClient.tsx` (신규)

```tsx
"use client";
import { useDesignerTabs } from './hooks/useDesignerTabs';
import { useFavoriteToggle } from './hooks/useFavoriteToggle';
import DetailHeader from './components/DetailHeader';
import PortfolioHero from './components/PortfolioHero';
import DesignerInfoSection from './components/DesignerInfoSection';
import HighlightBubble from './components/HighlightBubble';
import ReservationSection from './components/ReservationSection';
import SpecialityChips from './components/SpecialityChips';
import LanguageSection from './components/LanguageSection';
import PortfolioGrid from './components/PortfolioGrid';
import ServicesList from './components/ServicesList';
import ReviewSection from './components/ReviewSection';
import type { DesignerDetail } from '@/lib/designers';

export default function DesignerDetailClient({ designer }: { designer: DesignerDetail }) {
  const { activeTab, setActiveTab } = useDesignerTabs();
  const { isFavorite, toggle } = useFavoriteToggle(designer.id);

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-[76px]">
      <DetailHeader
        name={designer.displayName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {activeTab === 'designer' && (
        <>
          <PortfolioHero
            images={designer.portfolioImages}
            isFavorite={isFavorite}
            onToggleFavorite={toggle}
          />
          <DesignerInfoSection designer={designer} />
          <HighlightBubble message={designer.highlightMessage} />
          <ReservationSection links={designer.otherLinks} />
          <SpecialityChips
            keywords={designer.keywords.filter(k => k.categorySlug === 'treatment')}
          />
          <LanguageSection languages={designer.languages} />
          <PortfolioGrid images={designer.portfolioImages} limit={4} columns={2} />
          <ServicesList designerId={designer.id} />
          <ReviewSection designerId={designer.id} />
        </>
      )}
      {activeTab === 'portfolio' && (
        <PortfolioGrid images={designer.portfolioImages} columns={3} />
      )}
    </div>
  );
}
```

### 4.6 `hooks/useDesignerTabs.ts` (신규)

```ts
"use client";
import { useState } from 'react';
export type DesignerTab = 'designer' | 'portfolio';

export function useDesignerTabs(initial: DesignerTab = 'designer') {
  const [activeTab, setActiveTab] = useState<DesignerTab>(initial);
  return {
    activeTab,
    setActiveTab,
    tabs: [
      { id: 'designer' as const, label: 'Designer' },
      { id: 'portfolio' as const, label: 'Portfolio' },
    ],
  };
}
```

> 추후 URL 동기화 시: `useSearchParams` + `router.replace` 로 내부 교체. 시그니처 동일.

### 4.7 `hooks/useFavoriteToggle.ts` (신규)

```ts
"use client";
import { useState } from 'react';

export function useFavoriteToggle(designerId: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  return {
    isFavorite,
    toggle: () => setIsFavorite(v => !v),
    isLoading: false,
  };
}
```

> 추후 favorite 테이블 도입 시: useState → useMutation/useQuery 패턴으로 본문 교체. 시그니처 동일.

### 4.8 `components/DetailHeader/index.tsx` (신규)

- Sticky top, white bg, h-14
- 좌: ← 아이콘 버튼 (`router.back()`)
- 중: 디자이너 이름 (`typo-h6`)
- 우: ⋯ 메뉴 (이번 PDCA에서는 placeholder)
- 하단: 탭 (Designer / Portfolio) — underline 활성 표시

### 4.9 `components/PortfolioHero/index.tsx` (신규)

- `embla-carousel-react` 사용 (DS-6)
- 이미지 비율: `aspect-[3/4]` (Figma 기준)
- 우상단: ⭐ 저장 버튼 (props.isFavorite, onToggleFavorite)
- 하단 도트 인디케이터
- 별도 hook: `components/PortfolioHero/useHeroCarousel.ts` — embla state(currentIndex, scrollTo)

### 4.10 `components/DesignerInfoSection/index.tsx` (신규)

- 좌: 60×60 원형 프로필 이미지 (SafeImage)
- 우: 이름 + 역할 + ⭐별점 (rating_avg, review_count) + bio

### 4.11 `components/HighlightBubble/index.tsx` (신규)

- props: `message: string | null`
- null이면 `return null`
- Figma의 말풍선 (회색 둥근 사각형 + tail)

### 4.12 `components/ReservationSection/index.tsx` (신규)

- 4개 행: Message / Instagram / WhatsApp / Naver
- 각 행: 아이콘 + 라벨 + CTA (활성 시 "Send" 등, 비활성 시 disabled 회색)
- `props.links[key]` 존재 여부로 활성/비활성 결정

### 4.13 `components/SpecialityChips/index.tsx` (신규)

```tsx
export default function SpecialityChips({ keywords }: { keywords: DesignerKeyword[] }) {
  if (keywords.length === 0) return null;
  return (
    <section className="px-4 py-5">
      <h2 className="typo-h6 text-surface-950 mb-3">Speciality</h2>
      <div className="flex flex-wrap gap-2">
        {keywords.map(k => (
          <KeywordFilter
            key={k.slug}
            label={k.name}
            slug={k.slug}
            activated  // 활성 스타일 강제
            variant="filled"
          />
        ))}
      </div>
    </section>
  );
}
```

### 4.14 `components/LanguageSection/index.tsx` (신규)

```tsx
import LanguageTag from '@/app/(main)/discover/components/LanguageTag';
// 위 import는 cross-feature 의존이라 향후 LanguageTag를 src/components/로 승격 검토 필요 (별도 PDCA)
```

### 4.15 `components/PortfolioGrid/index.tsx` (신규)

- props: `images: string[], limit?: number, columns?: 2|3`
- `limit` 미지정 시 전체 노출
- 2-col 그리드: `grid-cols-2 gap-1`
- 3-col 그리드: `grid-cols-3 gap-0.5`
- limit 초과 시 하단 "View more" 버튼 (이번 PDCA에서는 `setActiveTab('portfolio')` 호출 — props로 핸들러 받음)

### 4.16 `components/ServicesList/index.tsx` (신규)

```tsx
import { getMockServices } from '@/mocks/designer-services';

export default function ServicesList({ designerId }: { designerId: string }) {
  const services = getMockServices(designerId); // 디자이너ID 해시로 2~3 변형 분기
  return (
    <section className="px-4 py-5">
      <h2 className="typo-h6 text-surface-950 mb-3">Providing Services & Price</h2>
      <ul className="flex flex-col gap-3">
        {services.map(s => <li key={s.id}>...</li>)}
      </ul>
    </section>
  );
}
```

### 4.17 `components/ReviewSection/index.tsx` (신규)

- 동일 패턴: `getMockReviews(designerId)` → 2~3개 카드 렌더

### 4.18 `src/mocks/designer-services.ts` (신규)

```ts
type MockService = { id: string; name: string; price: number; tag?: 'Popular' | 'New' };

const VARIANTS: MockService[][] = [
  [
    { id: 's1', name: 'Balayage & Toning', price: 250000, tag: 'Popular' },
    { id: 's2', name: 'Customized Magic Straightening', price: 200000 },
    { id: 's3', name: 'K-Pop Trend Cut & Styling', price: 90000, tag: 'Popular' },
  ],
  [ /* variant 2 */ ],
  [ /* variant 3 */ ],
];

export function getMockServices(designerId: string): MockService[] {
  const idx = hash(designerId) % VARIANTS.length;
  return VARIANTS[idx];
}

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}
```

### 4.19 `src/mocks/designer-reviews.ts` (신규)

동일 구조. 3개 변형 × 각 2~3 리뷰.

### 4.20 `src/components/SafeImage.tsx` (신규)

```tsx
"use client";
import { useState } from 'react';
import { storageUrl } from '@/lib/storage';

type Props = {
  src: string | null;
  alt: string;
  fallback?: 'profile' | 'portfolio';
  className?: string;
};

export default function SafeImage({ src, alt, fallback = 'portfolio', className }: Props) {
  const [errored, setErrored] = useState(false);
  const url = errored || !src
    ? storageUrl(`asset/placeholder/${fallback}.svg`)
    : storageUrl(src);
  return <img src={url} alt={alt} className={className} onError={() => setErrored(true)} />;
}
```

### 4.21 `src/app/(main)/discover/components/DesignerCard.tsx` (수정 — Plan FR-17)

```tsx
import Link from 'next/link';

export interface DesignerCardProps {
  id: string;  // ← 추가
  name: string;
  role: string;
  // ... 기존
}

export default function DesignerCard({ id, name, ... }: DesignerCardProps) {
  return (
    <Link
      href={`/designer/${id}`}
      prefetch={false}
      className="relative w-[212px] h-[225px] rounded-2xl overflow-hidden shrink-0 bg-surface-300 block"
    >
      {/* 기존 내용 그대로 */}
    </Link>
  );
}
```

### 4.22 `src/app/(main)/discover/components/DesignerCarousel.tsx` (수정 — Plan FR-16)

```tsx
// MOCK_DESIGNERS 제거. props로 디자이너 리스트 받음.
import type { DesignerListItem } from '@/lib/designers';

export default function DesignerCarousel({ designers }: { designers: DesignerListItem[] }) {
  return (
    <div className="flex flex-col gap-4 pb-20">
      <p className="typo-h5 text-surface-950">Best Match for you</p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {designers.map(d => (
          <DesignerCard
            key={d.id}
            id={d.id}
            name={d.displayName}
            role={d.role}
            languages={d.languages}
            profileImage={d.profileImageUrl ?? ''}
            portfolioImage={d.portfolioImages[0] ?? ''}
            highlightMessage={d.highlightMessage ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}
```

### 4.23 `src/app/(main)/discover/page.tsx` (수정)

`getBestMatchDesigners()` 추가 fetch → `DiscoverClient`에 props 전달 → `DiscoverClient`가 `DesignerCarousel`로 forward.

### 4.24 `src/app/(main)/discover/DiscoverClient.tsx` (수정)

`designers: DesignerListItem[]` prop 추가, PullBar 내부에서 `<DesignerCarousel designers={designers} />` 호출.

---

## 5. State Flow

### 5.1 라우트 진입

```
/discover (DesignerCarousel 카드 탭)
    │
    ▼
<Link href="/designer/{uuid}">  (next/link, prefetch=false)
    │
    ▼
page.tsx (Server)
  await params
  await getDesignerById(uuid)
    │ (null) → notFound() → 404 page
    │
    ▼ (DesignerDetail)
<DesignerDetailClient designer={...} />
```

### 5.2 탭 전환

```
DetailHeader (Designer/Portfolio 탭 클릭)
    │
    ▼
useDesignerTabs.setActiveTab('portfolio')
    │
    ▼
DesignerDetailClient 재렌더 → 조건부 섹션 스왑
    (URL 변화 없음)
```

### 5.3 ⭐ 토글

```
PortfolioHero 우상단 ⭐ 클릭
    │
    ▼
onToggleFavorite (props from Client)
    │
    ▼
useFavoriteToggle.toggle() → setIsFavorite(v => !v)
    │
    ▼
PortfolioHero 재렌더 (별 아이콘 색상 변경)
    (DB 호출 없음, 새로고침 시 초기화)
```

### 5.4 뒤로가기

```
DetailHeader ← 버튼
    │
    ▼
const router = useRouter()
router.back()
    │
    ▼
브라우저 history pop → /discover (스크롤 복원은 Next.js 기본)
```

---

## 6. UI Spec

### 6.1 Detail Header

| 요소 | 스펙 |
|------|------|
| 컨테이너 | `sticky top-0 bg-surface-white z-30 border-b border-surface-100` |
| 좌측 ← | `size-10 rounded-full hover:bg-surface-100`, 아이콘 24px |
| 중앙 이름 | `typo-h6 text-surface-950` |
| 탭 컨테이너 | `flex border-b border-surface-100`, 각 탭 `flex-1 py-3 text-center` |
| 활성 탭 | `text-surface-950 typo-button border-b-2 border-primary-600` |
| 비활성 탭 | `text-surface-500 typo-body2` |

### 6.2 Portfolio Hero

| 요소 | 스펙 |
|------|------|
| 컨테이너 | `relative aspect-[3/4] bg-surface-200` |
| Embla viewport | `overflow-hidden h-full` |
| Slide | `flex-[0_0_100%] h-full`, `<SafeImage class="w-full h-full object-cover">` |
| ⭐ 버튼 | `absolute top-4 right-4 size-10 rounded-full bg-surface-white/90 shadow` |
| 도트 | `absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5`, dot `size-1.5 rounded-full`, 활성 `bg-surface-white`, 비활성 `bg-surface-white/50` |

### 6.3 Designer Info Section

| 요소 | 스펙 |
|------|------|
| 컨테이너 | `flex gap-3 px-4 py-4 border-b border-surface-100` |
| 프로필 | `size-[60px] rounded-full overflow-hidden bg-surface-300` |
| 이름 행 | `flex items-baseline gap-2` — `typo-h5 text-surface-950` + `typo-caption text-surface-500` (role) |
| 별점 행 | `⭐ 4.7 (2,422)` — `typo-caption2 text-surface-700` |
| Bio | `typo-body2 text-surface-700 mt-2` |

### 6.4 Highlight Bubble

| 요소 | 스펙 |
|------|------|
| 컨테이너 | `mx-4 my-3 px-3 py-2.5 bg-surface-100 rounded-xl relative` |
| Tail | `absolute -top-1 left-6 size-2 rotate-45 bg-surface-100` |
| 텍스트 | `typo-body2 text-surface-800` |

### 6.5 Reservation Section

| 요소 | 스펙 |
|------|------|
| 행 | `flex items-center gap-3 px-4 py-3 border-b border-surface-100` |
| 첫 행 (Message) | `bg-secondary-400 text-surface-white rounded-xl mx-4 mt-2 mb-1 py-3.5` (CTA 강조) |
| 아이콘 | `size-6` |
| 라벨 | `typo-body1 text-surface-950 flex-1` |
| CTA 텍스트 | `typo-button text-secondary-500` (활성) / `text-surface-300` (비활성) |

### 6.6 Speciality / Language

| 요소 | 스펙 |
|------|------|
| 섹션 컨테이너 | `px-4 py-5 border-b border-surface-100` |
| 타이틀 | `typo-h6 text-surface-950 mb-3` |
| 칩 컨테이너 | `flex flex-wrap gap-2` |
| 칩 | 기존 `KeywordFilter` (Speciality) / `LanguageTag` (Language) 재사용 |

### 6.7 Portfolio Grid

| 요소 | 스펙 |
|------|------|
| 컨테이너 | `px-4 py-5 border-b border-surface-100` |
| 타이틀 행 | `flex justify-between items-center mb-3` — 좌 `typo-h6`, 우 `typo-button text-surface-500 View more` |
| 그리드 (Designer 탭) | `grid grid-cols-2 gap-1` — 4개만 |
| 그리드 (Portfolio 탭) | `grid grid-cols-3 gap-0.5` — 전체 |
| 셀 | `aspect-square <SafeImage object-cover>` |

### 6.8 Services List

| 요소 | 스펙 |
|------|------|
| 컨테이너 | `px-4 py-5 border-b border-surface-100` |
| 타이틀 행 | `flex justify-between` (좌 타이틀, 우 "View more") |
| 행 | `flex justify-between items-center py-3` |
| 좌측 | 서비스명 (`typo-body1`) + 배지 (Popular/New) |
| 우측 | 가격 (`typo-h6 text-surface-950`) — 천단위 콤마 + "₩" |

### 6.9 Review Section

| 요소 | 스펙 |
|------|------|
| 컨테이너 | `px-4 py-5` |
| 카드 | `border border-surface-100 rounded-xl p-4 mb-3` |
| 별점 행 | `flex items-center gap-1` — ⭐ 5개 + 작성자명 |
| 본문 | `typo-body2 text-surface-700 mt-2` |

### 6.10 Page UI Checklist

> Check phase에서 gap-detector가 verify 할 항목.

- [ ] Detail Header: ← 버튼 + 디자이너 이름 + Designer/Portfolio 탭
- [ ] Portfolio Hero: 캐러셀 + 도트 + ⭐
- [ ] Designer Info: 프로필 + 이름·역할 + 별점 + bio
- [ ] Highlight Bubble (highlight_message 있을 때만)
- [ ] Reservation: Message/Instagram/WhatsApp/Naver 4행
- [ ] Speciality: treatment 카테고리 키워드 칩
- [ ] Language: 디자이너 languages 배열 → LanguageTag
- [ ] Portfolio Grid: 2×2 + View more
- [ ] Services: Mock 3행 + 가격
- [ ] Reviews: Mock 2~3 카드
- [ ] 하단 탭바 (`(main)/layout.tsx` 상속)
- [ ] Portfolio 탭 활성 시 다른 섹션 숨김 + Grid 3-col 전체 표시

---

## 7. API/Data Contract

### 7.1 `getDesignerById(id)` Contract

| 항목 | 값 |
|------|-----|
| Input | `id: string` (UUID v4) |
| Output | `Promise<DesignerDetail \| null>` |
| null 반환 조건 | UUID 형식 invalid / 행 없음 / Supabase error |
| Side Effects | Supabase 2 호출 (병렬) |

### 7.2 `getBestMatchDesigners(limit)` Contract

| 항목 | 값 |
|------|-----|
| Input | `limit?: number = 10` |
| Output | `Promise<DesignerListItem[]>` |
| 정렬 | `created_at DESC` (임시) |
| 빈 배열 가능 | YES |

### 7.3 Mock Contract

| Function | Input | Output |
|----------|-------|--------|
| `getMockServices(designerId)` | string | `MockService[]` (length 2~5) |
| `getMockReviews(designerId)` | string | `MockReview[]` (length 2~3) |

---

## 8. Test Plan

### 8.1 L1 — DB Layer (수동 SQL)

```sql
-- migration/seed 적용 후
SELECT id, display_name, role, profile_image_url, array_length(portfolio_images, 1) AS pi_len
FROM designer_profile LIMIT 5;
-- 모든 행: display_name NOT NULL, role NOT NULL, pi_len >= 1
```

### 8.2 L2 — UI Action (수동, 브라우저)

| Step | Expected |
|------|----------|
| `pnpm dev` 후 `/discover` 접속 | 캐러셀 카드 노출 (실 DB 데이터) |
| 카드 1개 탭 | `/designer/{uuid}` 이동, 페이지 렌더 |
| ← 버튼 탭 | `/discover` 복귀 |
| 카드 다른 거 탭 → 다시 ← | 두 디자이너 모두 정상 렌더 |
| Portfolio 탭 클릭 | 다른 섹션 숨김, 3-col 그리드 노출 |
| Designer 탭 복귀 | 원래 섹션 복원 |
| ⭐ 클릭 | 별 색상 변경, 새로고침 시 초기화 |
| `/designer/00000000-0000-0000-0000-000000000000` 직접 접속 | Next.js 404 |
| `/designer/not-a-uuid` 직접 접속 | Next.js 404 |

### 8.3 L3 — E2E (Playwright, 추후)

이번 PDCA에서는 E2E 미작성. 다음 검증 PDCA에서 `tests/e2e/designer-detail.spec.ts` 작성.

### 8.4 Visual QA

Figma 363:11455와 좌우 스크린샷 비교 (모바일 375 폭 기준).

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| `embla-carousel-react` 신규 의존 도입 | 번들 사이즈 +20KB | 가벼운 표준 라이브러리. 자체 구현 시 터치/접근성 검증 비용 더 큼 |
| `display_name` 시드 작성에 30개 이름 풀 cycling 시 중복 노출 | UX (중복 이름) | 이번엔 mock 단계라 허용. Auth + user 테이블 도입 시 자연 해결 |
| `src/lib/designers.ts` 삭제 + 폴더 생성 시 import 경로 동작 확인 필요 | 빌드 실패 | Node module resolution은 `designers/index.ts` 자동 인식. 수동 검증: MapView, DiscoverClient에서 `from "@/lib/designers"` 모두 통과 |
| `other_links` JSONB의 미합의된 키(`message`) 처리 | UX | DS-4에서 4개 키 명시. message는 일단 mailto 링크 정도로 시드. UI는 disabled fallback |
| Storage 도메인이 next/image remotePatterns 미등록 | 이미지 안 뜸 | `<img>` 사용 (NFR-05). next/image 도입은 별도 PDCA |
| Cross-feature import (`LanguageTag`은 discover/components/ 위치) | 모듈 결합도 | 본 PDCA 후속에서 `LanguageTag`을 `src/components/`로 승격 검토. 지금은 직접 import 허용 |
| Migration 두 번 분리(`add_media`, `display_name_not_null`) 잊고 reset 시 fail | 로컬 DB reset 실패 | Do phase에서 두 migration을 동일 timestamp 짝(_001, _002)로 작성. README/design에 reset 순서 명시 |
| Mock 변형이 충분하지 않아 같은 mock 자주 노출 | UX 혼란 약화 | 변형 3개로 시작. 사용자가 디자이너 다수 클릭하지는 않으므로 허용 가능 |
| ⭐ UI-only 영속화 부재 | 유저 기대 불일치 | DS-8 — 추후 hook 본문만 교체. 토글 자체는 즉시 반응으로 인식 흐름 유지 |
| Server `params` await 누락 | Next.js 16 런타임 에러 | DS-9의 page.tsx 예시에서 명시. lint rule 또는 PR review로 catch |

---

## 10. Success Criteria (Plan SC-01~SC-16 매핑)

| Plan SC | Design 검증 |
|---------|-------------|
| SC-01 | UI Checklist 6.10 + Visual QA 8.4 |
| SC-02 | L2 §8.2 step "카드 1개 탭" |
| SC-03 | L2 §8.2 step "← 버튼 탭" |
| SC-04 | L2 §8.2 step "잘못된 UUID 직접 접속" |
| SC-05 | L2 §8.2 step "Portfolio 탭 클릭" |
| SC-06 | UI Checklist 6.10 Speciality 항목 + 4.13 SpecialityChips 필터링 로직 |
| SC-07 | UI Checklist 6.10 Language 항목 |
| SC-08 | 4.11 HighlightBubble — null check |
| SC-09 | 6.2 PortfolioHero 도트 + 4.9 useHeroCarousel |
| SC-10 | 4.15 PortfolioGrid limit prop + 6.7 |
| SC-11 | 4.7 useFavoriteToggle + L2 §8.2 step "새로고침 시 초기화" |
| SC-12 | L1 §8.1 SQL 검증 |
| SC-13 | NFR-01 — `grep` 검증 |
| SC-14 | DesignerCarousel 4.22 — MOCK_DESIGNERS 제거 |
| SC-15 | (main)/layout.tsx 상속 — 자동 |
| SC-16 | 4.2 queries.ts toDomain + 4.1 index.ts public surface |

---

## 11. Implementation Guide

### 11.1 파일 변경 요약

| 종류 | 파일 | 비고 |
|------|------|------|
| **신규 SQL** | `supabase/migrations/20260424000001_add_designer_media.sql` | DS-2/3 + Plan FR-18 |
| **신규 SQL** | `supabase/migrations/20260424000002_designer_display_name_not_null.sql` | NOT NULL 적용 (시드 후) |
| **수정 SQL** | `supabase/seed/40_designers.sql` | display_name, role, profile_image_url, portfolio_images 추가 |
| **수정 SQL** (선택) | `supabase/seed/40_designers.sql` 또는 신규 `42_designer_links.sql` | other_links 일부 채움 |
| **신규 TS** | `src/lib/designers/types.ts` | DesignerDetail, DesignerKeyword, DesignerListItem, DesignerLinks, DesignerMapItem |
| **신규 TS** | `src/lib/designers/queries.ts` | getDesignerById |
| **신규 TS** | `src/lib/designers/list.ts` | getBestMatchDesigners + getDesignerMapItems (이전) |
| **신규 TS** | `src/lib/designers/index.ts` | re-export |
| **삭제** | `src/lib/designers.ts` | list.ts/queries.ts/index.ts로 분해 |
| **신규** | `src/components/SafeImage.tsx` | onError fallback wrapper |
| **신규** | `src/mocks/designer-services.ts` | 변형 3개 |
| **신규** | `src/mocks/designer-reviews.ts` | 변형 3개 |
| **신규** | `src/app/(main)/designer/[designerId]/page.tsx` | Server, fetch + notFound |
| **신규** | `src/app/(main)/designer/[designerId]/DesignerDetailClient.tsx` | Client orchestrator |
| **신규** | `src/app/(main)/designer/[designerId]/hooks/useDesignerTabs.ts` | DS-7 |
| **신규** | `src/app/(main)/designer/[designerId]/hooks/useFavoriteToggle.ts` | DS-8 |
| **신규** (10) | `src/app/(main)/designer/[designerId]/components/{Section}/index.tsx` | DetailHeader, PortfolioHero, DesignerInfoSection, HighlightBubble, ReservationSection, SpecialityChips, LanguageSection, PortfolioGrid, ServicesList, ReviewSection |
| **신규** | `src/app/(main)/designer/[designerId]/components/PortfolioHero/useHeroCarousel.ts` | embla state |
| **수정** | `src/app/(main)/discover/components/DesignerCard.tsx` | id prop + Link 래핑 |
| **수정** | `src/app/(main)/discover/components/DesignerCarousel.tsx` | MOCK_DESIGNERS 제거, props로 designers 받음 |
| **수정** | `src/app/(main)/discover/page.tsx` | getBestMatchDesigners() fetch 추가 |
| **수정** | `src/app/(main)/discover/DiscoverClient.tsx` | designers prop forward |
| **신규 dependency** | `embla-carousel-react` | DS-6 |

총 **신규 파일 ~22개, 수정 파일 4개, 삭제 1개**.

### 11.2 구현 순서

1. **Module 1 — DB 스키마 및 시드** (`migration_001`, `seed/40_designers.sql` 수정, `migration_002`)
2. **Module 2 — Domain Layer** (`src/lib/designers/{types,queries,list,index}.ts` + 기존 designers.ts 삭제)
3. **Module 3 — 공용 유틸** (`SafeImage`, `mocks/designer-services`, `mocks/designer-reviews`)
4. **Module 4 — Hooks** (`useDesignerTabs`, `useFavoriteToggle`)
5. **Module 5 — 라우트 + 헤더/Hero** (`page.tsx`, `DesignerDetailClient.tsx`, `DetailHeader`, `PortfolioHero` + embla install)
6. **Module 6 — 정보 섹션 4개** (`DesignerInfoSection`, `HighlightBubble`, `ReservationSection`, `LanguageSection`)
7. **Module 7 — 리스트 섹션 3개** (`SpecialityChips`, `PortfolioGrid`, `ServicesList`, `ReviewSection`)
8. **Module 8 — Discover 연동** (`DesignerCard`, `DesignerCarousel`, `discover/page.tsx`, `DiscoverClient`)
9. **Module 9 — 수동 검증** (L1 SQL, L2 UI flow)

### 11.3 Session Guide

> **목적**: `/pdca do designer-detail --scope module-N` 으로 세션 단위 점진 구현 가능.

#### Module Map

| Module | 키 | 파일 수 | 추정 시간 | 의존 |
|--------|----|--------|---------|------|
| **module-1** | db-schema | 3 SQL | 30분 | — |
| **module-2** | domain-layer | 4 TS + 1 삭제 | 30분 | module-1 |
| **module-3** | shared-utils | 3 TS | 30분 | — (병렬 가능) |
| **module-4** | hooks | 2 TS | 15분 | — (병렬 가능) |
| **module-5** | route-shell | 4 TS + 1 dep | 60분 | module-2, module-4 |
| **module-6** | info-sections | 4 TS | 45분 | module-5 |
| **module-7** | list-sections | 4 TS | 60분 | module-5, module-3 |
| **module-8** | discover-wiring | 4 TS 수정 | 30분 | module-2 |
| **module-9** | manual-qa | — | 30분 | all |

#### Recommended Session Plan

> 4시간 ÷ 1.5h 세션 = 약 3 세션 권장

| 세션 | scope | 산출 |
|------|-------|------|
| **Session 1** | `module-1,module-2,module-3,module-4` | DB 스키마 + 도메인 레이어 + 유틸 + 훅 (백엔드/공용 완성) |
| **Session 2** | `module-5,module-6,module-7` | 라우트 + 모든 섹션 컴포넌트 (페이지 시각 완성) |
| **Session 3** | `module-8,module-9` | Discover 연동 + 수동 QA (플로우 완성) |

`/pdca do designer-detail --scope module-1` 처럼 호출.

---

## 12. 관련 문서

- [Plan](../../01-plan/features/designer-detail.plan.md)
- [Figma — Designer Detail (363:11455)](https://www.figma.com/design/1EccDx1qvrkFZBsNEFbWjj/Batch1_Design?node-id=363-11455)
- [Filter Popup Redesign Design](./filter-popup-redesign.design.md) — Server fetch + Client orchestrator 패턴 참조
- [Phase 1 SQL Plan](../../01-plan/features/phase1-sql.plan.md) — designer_profile 원본 스키마
- [Project CLAUDE.md](../../../CLAUDE.md) — 디자인 토큰, Git, 빌드 정책
- [Discover CLAUDE.md](../../../src/app/(main)/discover/CLAUDE.md)

---

## 13. 다음 단계

- `/pdca do designer-detail` — 전체 구현 가이드 (Session 1 시작)
- 또는 `/pdca do designer-detail --scope module-1,module-2,module-3,module-4` — Session 1만
- 구현 완료 후 `/pdca analyze designer-detail` — Gap 분석

---

## 14. 후속 PDCA 메모 (2026-04-25 추가)

### 14.1 portfolio-entity (Path C) — 필수 후속

**계기**: Figma node 363:11694 (Portfolio 탭) 분석에서 **이미지 카드별 제목 + 키워드 + ⭐**이 발견됨. 현 PDCA에서는 시각 placeholder도 두지 않고 **별도 PDCA로 완전 분리** (사용자 결정).

**스코프 (별도 PDCA로 시작 예정)**:

| 변경 | 내용 |
|------|------|
| **신규 테이블** | `portfolio` (id, designer_id FK, image_url, title, description?, display_order, is_pinned, created_at) |
| **신규 N:M 테이블** | `portfolio_keyword` (portfolio_id FK, keyword_id FK → master `keyword` 재사용) |
| **컬럼 제거** | `designer_profile.portfolio_images TEXT[]` (DROP) |
| **도메인 타입** | `DesignerDetail.portfolioImages: string[]` → `portfolio: PortfolioItem[]` (with id, imageUrl, title, keywords) |
| **getDesignerById** | portfolio JOIN 추가 (3-단계 fetch) |
| **PortfolioHero** | 시그니처 `images: string[]` → `items: PortfolioItem[]`, `item.imageUrl` 사용 |
| **PortfolioGrid** | 카드 모드 신설 — 이미지 + title + keyword chips + ⭐ |
| **DesignerCard (Discover)** | `portfolioImage: portfolioImages[0]` → `portfolio[0].imageUrl` |
| **시드** | `40_designers.sql`의 portfolio_images UPDATE 제거. 신규 `41_portfolios.sql` 작성 — 디자이너당 4장 = 600행 + 키워드 매핑 |
| **마이그레이션 순서** | (1) portfolio 생성 → (2) portfolio_keyword 생성 → (3) 데이터 이전 (기존 array → row) → (4) 컬럼 DROP |

**ERD 정합성**: `db-current-structure.md §6` 에 이미 "범위 밖" 으로 명시되어 있던 `portfolio` 엔티티의 실제 도입.

**왜 별도 PDCA?**
- 본 PDCA(designer-detail) 스코프 비대화 회피
- portfolio 엔티티는 Salon Detail / Article 등 다른 라우트에서도 재사용될 가능성
- 마이그레이션 + 시그니처 변경 + UI 카드 모드까지 1.5~2.5h 별도 사이클 가치

### 14.2 그 외 후속

- `salon-detail` — `/salon/[salonId]` 동일 패턴 적용
- `map-pin-navigation` — MapView designer/salon 핀 클릭 → 상세 이동
- `favorite-persistence` — favorite 테이블 + Auth + `useFavoriteToggle` 본문 교체 (DS-8)
- `auth-identity-migration` — app_user 테이블 + display_name override 패턴 (db-current-structure.md §7)
