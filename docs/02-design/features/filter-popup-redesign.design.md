# Filter Popup Redesign — Design Document

> **Created**: 2026-04-21
> **Status**: Draft
> **Feature**: filter-popup-redesign
> **Phase**: Design
> **Architecture**: **Option C — Pragmatic (Colocated Decomposition)**
> **Plan**: [`../../01-plan/features/filter-popup-redesign.plan.md`](../../01-plan/features/filter-popup-redesign.plan.md)

---

## Context Anchor

> Plan에서 승계. 세션 간 의사결정 컨텍스트 유지.

| 항목 | 내용 |
|------|------|
| **WHY** | Discover 탭을 "정량 필터" 역할로 확립하기 위해 필터 키워드와 디자이너/살롱 키워드를 동일한 `keyword` 테이블에서 관리. Discover·Style 탭 역할 분리(논의서 §1)의 첫 구현. |
| **WHO** | 주변 살롱/디자이너를 정확 조건으로 필터링하려는 고객, DB 키워드를 관리할 운영자. |
| **RISK** | (1) Supabase 클라이언트 최초 도입이라 env 설정 실수, (2) Server→Client props 전달 시 직렬화 이슈, (3) Service 그룹 펼침 상태와 activeKeywords 상태 혼선, (4) 키워드 이름 변경 시 stale label로 필터 깨짐. |
| **SUCCESS** | Selected Keywords + 4개 카테고리 섹션 렌더, 하드코딩 0, 그룹 탭 = 펼침 전용, X 버튼 개별 해제, 44+7개 키워드 정상 노출. |
| **SCOPE** | IN: Supabase 셋업, keyword fetch, FilterPopup 4카테고리 재구성, Service 2단계 펼침, Salon Features 시드, Selected 상단 섹션 + X 해제. OUT: Recommended, My 탭 프로필, 실제 쿼리 필터링, activeKeywords 영속화, Clear all 버튼. |

---

## 1. Overview

본 설계는 Option C(Pragmatic Colocated Decomposition)를 채택한다. 요지는:

- **신규 서브 컴포넌트 2개**만 추가(`SelectedKeywordsSection`, `ServiceGroupSection`)
- **디렉토리 구조 변경 없음**(`features/` 신설 금지, Discover CLAUDE.md 컨벤션 준수)
- **상태 분리**: 전역 `activeKeywords`는 `page.tsx`, UI-only 펼침 상태 `expandedGroup`은 `FilterPopup` 로컬
- **서버 shape 완료 후 props 전달**: Client에서 `useMemo`로 재그룹핑하지 않음 → Hydration 불일치 위험 0

---

## 2. Architecture

### 2.1 Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Data Layer (Server only)                                   │
│  ┌─────────────────────────┐  ┌──────────────────────────┐ │
│  │ src/lib/supabase.ts     │  │ src/lib/keywords.ts      │ │
│  │  createServerClient()   │─▶│  getFilterKeywords()      │ │
│  │  (env-validated)        │  │  → shape into sections   │ │
│  └─────────────────────────┘  └──────────────────────────┘ │
└────────────────────────────────────┬────────────────────────┘
                                     │ (Server Component fetch)
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Page Layer                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ app/(main)/discover/page.tsx  (Client Component)    │   │
│  │  - props: filterSections                            │   │
│  │  - state: activeKeywords: Set<slug>                 │   │
│  │  - handlers: toggleKeyword, removeKeyword           │   │
│  └───────────────────┬─────────────────┬───────────────┘   │
└──────────────────────┼─────────────────┼───────────────────┘
                       │                 │
                       ▼                 ▼
           ┌─────────────────┐ ┌─────────────────────────┐
           │ SearchHeader    │ │ FilterPopup             │
           │  (slug mode)    │ │  - props: filterSections│
           └─────────────────┘ │  - local: expandedGroup │
                               └────┬─────────────────────┘
                                    │
                    ┌───────────────┼───────────────────┐
                    ▼               ▼                   ▼
        ┌───────────────────┐ ┌─────────────┐ ┌─────────────────┐
        │ SelectedKeywords  │ │ Category    │ │ ServiceGroup    │
        │  Section          │ │ (inline)    │ │ Section         │
        │  (FR-12~16)       │ │ Languages/  │ │  (FR-06, FR-07) │
        │                   │ │ HairType/   │ │                 │
        │                   │ │ SalonFeat   │ │                 │
        └───────────────────┘ └─────────────┘ └─────────────────┘
                    ▼               ▼                   ▼
              ┌──────────────────────────────────────────┐
              │ KeywordFilter (확장: onRemove prop)       │
              │  - onRemove 있음 → X 버튼 + activated 강제 │
              │  - onRemove 없음 → 기존 동작             │
              └──────────────────────────────────────────┘
```

### 2.2 Decision Record

| ID | 결정 | 근거 |
|----|------|------|
| D-1~D-7 | (Plan에서 확정) | Plan §4 참조 |
| **DS-1** | 서버 측 `getFilterKeywords()`가 **최종 섹션 형상**을 반환 (treatment는 `groups`, 나머지는 `keywords`) | 클라 `useMemo` 제거, Hydration 안정, 단일 진실 소스 |
| **DS-2** | `page.tsx`를 Client Component로 유지, fetch는 **부모 Server Component**에 위임 | 현재 `page.tsx`는 `"use client"` — `activeKeywords` 상태 보유. 중첩 Server→Client 구조 필요. **선택**: `page.tsx`를 Server로 전환하고 기존 state를 `DiscoverClient.tsx`로 이전 |
| **DS-3** | `expandedGroup`은 `FilterPopup` **로컬** `useState`, 팝업 닫힐 때 초기화 | 전역 상태 아님. 팝업 재오픈 시 최초 상태로 복귀하여 UX 예측 가능 |
| **DS-4** | `removeKeyword(slug)`를 별도 핸들러로 노출 (toggle과 분리) | 의도 차이 — toggle은 카테고리 내 칩 클릭, remove는 X 버튼. 같은 구현(`set.delete`)이지만 **호출 지점 로그/분석이 분리 가능** |
| **DS-5** | Server 쿼리 결과에서 `created_at` **drop** | Client에 Date 객체 직렬화 이슈 차단. 클라에서 불필요 |
| **DS-6** | env 검증: `src/lib/supabase.ts` 최상단에서 `process.env.NEXT_PUBLIC_SUPABASE_URL` 체크, 없으면 명확한 에러 throw | 빌드/런타임 양쪽에서 조기 실패 → 디버깅 비용↓ |

---

## 3. Data Model & Types

### 3.1 `src/types/keyword.ts` (신규)

```ts
/** Design Ref: §3 — DB keyword 테이블 1:1 대응 */

export type Keyword = {
  id: string;           // UUID
  name: string;         // "Balayage", "English"
  slug: string;         // "balayage", "english" — activeKeywords의 키
  group_name: string | null; // Treatment 그룹용 ("Cut"/"Color"/...)
  display_order: number;
};

export type KeywordGroup = {
  group_name: string;   // "Cut", "Color", "Perm", "Braids & Locs", "Care", "Barber"
  keywords: Keyword[];
};

/** 서버에서 shape 완료된 섹션 — FilterPopup이 바로 렌더 가능 */
export type FilterSection = {
  slug: FilterCategorySlug;  // "languages" | "hair_type" | "treatment" | "special_offers"
  displayName: string;       // UI 표시명: "Language" | "Hair Type" | "Service" | "Salon Features"
  /** 일반 카테고리 — 평면 리스트 */
  keywords?: Keyword[];
  /** treatment 전용 — 그룹 2단계 */
  groups?: KeywordGroup[];
};

export type FilterCategorySlug =
  | "languages"
  | "hair_type"
  | "treatment"
  | "special_offers";

/** display 순서 — Plan §5 FR-05 */
export const FILTER_SECTION_ORDER: FilterCategorySlug[] = [
  "languages",
  "hair_type",
  "treatment",
  "special_offers",
];

/** slug → UI 표시명 (FR-05) */
export const FILTER_SECTION_DISPLAY_NAME: Record<FilterCategorySlug, string> = {
  languages: "Language",
  hair_type: "Hair Type",
  treatment: "Service",
  special_offers: "Salon Features",
};
```

### 3.2 DB 쿼리 shape (Plan §2.3 재확정)

```sql
SELECT
  kc.slug     AS category_slug,
  kc.name     AS category_name,
  k.id, k.name, k.slug, k.group_name, k.display_order
FROM keyword_category kc
LEFT JOIN keyword k ON k.category_id = kc.id
WHERE kc.slug IN ('languages', 'hair_type', 'treatment', 'special_offers')
ORDER BY kc.display_order, k.group_name NULLS FIRST, k.display_order;
```

---

## 4. Module Design

### 4.1 `src/lib/supabase.ts` (신규)

```ts
// Design Ref: §2.2 DS-6 — env 조기 검증
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local",
  );
}

export const supabase = createClient(url, anonKey);
```

- Phase 1이므로 anon 키로 읽기 전용. Auth/RLS는 후속 PDCA.
- 향후 server/client 분리가 필요하면 별도 createServerClient / createBrowserClient로 리팩토링 가능 (현재는 단일 export).

### 4.2 `src/lib/keywords.ts` (신규)

```ts
// Design Ref: §2.1 Data Layer — 서버 shape 후 반환
import { supabase } from "./supabase";
import type {
  FilterSection,
  Keyword,
  KeywordGroup,
  FilterCategorySlug,
} from "@/types/keyword";
import {
  FILTER_SECTION_ORDER,
  FILTER_SECTION_DISPLAY_NAME,
} from "@/types/keyword";

type RawRow = {
  category_slug: string;
  category_name: string;
  id: string | null;
  name: string | null;
  slug: string | null;
  group_name: string | null;
  display_order: number | null;
};

/** FilterPopup이 렌더할 4개 섹션을 서버에서 완성된 형태로 반환 */
export async function getFilterKeywords(): Promise<FilterSection[]> {
  const { data, error } = await supabase
    .from("keyword_category")
    .select(`
      slug,
      name,
      keyword ( id, name, slug, group_name, display_order )
    `)
    .in("slug", FILTER_SECTION_ORDER)
    .order("display_order", { ascending: true });

  if (error) throw new Error(`[getFilterKeywords] ${error.message}`);

  // Supabase 관계형 select 결과 → FilterSection[] 변환
  const sections: FilterSection[] = FILTER_SECTION_ORDER.map((catSlug) => {
    const row = data?.find((r) => r.slug === catSlug);
    const keywords: Keyword[] = (row?.keyword ?? [])
      .map((k) => ({
        id: k.id,
        name: k.name,
        slug: k.slug,
        group_name: k.group_name,
        display_order: k.display_order,
      }))
      .sort((a, b) => a.display_order - b.display_order);

    const displayName = FILTER_SECTION_DISPLAY_NAME[catSlug];

    // treatment만 2단계 그룹핑
    if (catSlug === "treatment") {
      const groups = groupByGroupName(keywords);
      return { slug: catSlug, displayName, groups };
    }

    return { slug: catSlug, displayName, keywords };
  });

  return sections;
}

function groupByGroupName(keywords: Keyword[]): KeywordGroup[] {
  const map = new Map<string, Keyword[]>();
  for (const k of keywords) {
    const key = k.group_name ?? "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(k);
  }
  // 그룹 순서는 각 그룹 최소 display_order 기준
  return Array.from(map.entries())
    .sort(
      ([, a], [, b]) =>
        Math.min(...a.map((k) => k.display_order)) -
        Math.min(...b.map((k) => k.display_order)),
    )
    .map(([group_name, keywords]) => ({ group_name, keywords }));
}
```

### 4.3 `src/app/(main)/discover/page.tsx` — **Server Component 전환**

현재는 `"use client"` 상태 + state 보유. 이를 분리한다.

**변경 후**:

```tsx
// page.tsx (Server)
// Design Ref: §2.2 DS-2 — Server wrapper
import { getFilterKeywords } from "@/lib/keywords";
import DiscoverClient from "./DiscoverClient";

export default async function DiscoverPage() {
  const filterSections = await getFilterKeywords();
  return <DiscoverClient filterSections={filterSections} />;
}
```

**신규 `DiscoverClient.tsx`** (현재 page.tsx의 로직 이전 + 일부 수정):

```tsx
"use client";
// Design Ref: §2.1 Page Layer — 모든 client state 보유
import { useState } from "react";
import MapView from "./components/MapView";
import SearchHeader from "./components/SearchHeader";
import PullBar from "./components/PullBar";
import FilterPopup from "./components/FilterPopup";
import type { DiscoverMode } from "@/types/discover";
import type { FilterSection } from "@/types/keyword";

interface Props {
  filterSections: FilterSection[];
}

export default function DiscoverClient({ filterSections }: Props) {
  const [activeKeywords, setActiveKeywords] = useState<Set<string>>(new Set()); // Plan FR-09: slug 기반
  const [showFilter, setShowFilter] = useState(false);
  const [mode, setMode] = useState<DiscoverMode>("salon");

  // Design Ref: §2.2 DS-4 — toggle과 remove 분리
  const toggleKeyword = (slug: string) => {
    setActiveKeywords((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const removeKeyword = (slug: string) => {
    setActiveKeywords((prev) => {
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  };

  return (
    <div className="relative h-[calc(100dvh-76px)]">
      {/* ... 기존 레이아웃 동일 ... */}
      {showFilter && (
        <FilterPopup
          filterSections={filterSections}
          activeKeywords={activeKeywords}
          onToggle={toggleKeyword}
          onRemove={removeKeyword}
          onClose={() => setShowFilter(false)}
        />
      )}
      {/* SearchHeader에는 filterSections를 함께 전달하여 slug→name 매핑 가능 (FR-10) */}
      <SearchHeader
        filterSections={filterSections}
        activeKeywords={activeKeywords}
        /* ... */
      />
    </div>
  );
}
```

### 4.4 `FilterPopup.tsx` (수정)

```tsx
"use client";
// Design Ref: §2.1 Page Layer — orchestrator, UI-only state만 보유
import { useState } from "react";
import SelectedKeywordsSection from "./SelectedKeywordsSection";
import ServiceGroupSection from "./ServiceGroupSection";
import KeywordFilter from "./KeywordFilter";
import type { FilterSection } from "@/types/keyword";

interface FilterPopupProps {
  filterSections: FilterSection[];
  activeKeywords: Set<string>;
  onToggle: (slug: string) => void;
  onRemove: (slug: string) => void;
  onClose: () => void;
}

export default function FilterPopup({
  filterSections,
  activeKeywords,
  onToggle,
  onRemove,
}: FilterPopupProps) {
  return (
    <div className="h-full overflow-y-auto rounded-2xl bg-surface-50/95 backdrop-blur-[10px] px-[10px] pt-3 pb-5">
      <div className="flex flex-col gap-6">
        {/* Design Ref: §4.5 — FR-12 상단 섹션, 0개면 null */}
        <SelectedKeywordsSection
          filterSections={filterSections}
          activeKeywords={activeKeywords}
          onRemove={onRemove}
        />

        {filterSections.map((section) => (
          <CategoryBlock
            key={section.slug}
            section={section}
            activeKeywords={activeKeywords}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryBlock({
  section,
  activeKeywords,
  onToggle,
}: {
  section: FilterSection;
  activeKeywords: Set<string>;
  onToggle: (slug: string) => void;
}) {
  // Design Ref: §4.6 — treatment는 별도 컴포넌트
  if (section.slug === "treatment" && section.groups) {
    return (
      <ServiceGroupSection
        displayName={section.displayName}
        groups={section.groups}
        activeKeywords={activeKeywords}
        onToggle={onToggle}
      />
    );
  }

  // 일반 카테고리 — 평면 렌더
  return (
    <div className="flex flex-col gap-2">
      <h3 className="typo-h6 text-surface-900">{section.displayName}</h3>
      <div className="flex flex-wrap gap-1">
        {section.keywords?.map((k) => (
          <KeywordFilter
            key={k.slug}
            label={k.name}
            variant="filled"
            activated={activeKeywords.has(k.slug)}
            onClick={() => onToggle(k.slug)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 4.5 `SelectedKeywordsSection.tsx` (신규)

```tsx
"use client";
// Design Ref: §4.5 — Plan FR-12 ~ FR-16, Figma 374:10503
import KeywordFilter from "./KeywordFilter";
import type { FilterSection, Keyword } from "@/types/keyword";

interface Props {
  filterSections: FilterSection[];
  activeKeywords: Set<string>;  // slug set
  onRemove: (slug: string) => void;
}

export default function SelectedKeywordsSection({
  filterSections,
  activeKeywords,
  onRemove,
}: Props) {
  // Plan SC-09: 0개면 섹션 자체 숨김
  if (activeKeywords.size === 0) return null;

  // slug → Keyword 매핑 (전 섹션에서 평탄화)
  const allKeywords = filterSections.flatMap<Keyword>((s) =>
    s.groups ? s.groups.flatMap((g) => g.keywords) : (s.keywords ?? []),
  );
  const slugMap = new Map(allKeywords.map((k) => [k.slug, k]));

  // Plan FR-15: 선택 순서 유지 (Set의 iteration order = 삽입 순서)
  const selected = Array.from(activeKeywords)
    .map((slug) => slugMap.get(slug))
    .filter((k): k is Keyword => !!k);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="typo-h6 text-surface-900">Selected Keywords</h3>
      <div className="flex flex-wrap gap-1">
        {selected.map((k) => (
          <KeywordFilter
            key={k.slug}
            label={k.name}
            variant="filled"
            onRemove={() => onRemove(k.slug)} // Plan FR-13, FR-14
          />
        ))}
      </div>
    </div>
  );
}
```

### 4.6 `ServiceGroupSection.tsx` (신규)

```tsx
"use client";
// Design Ref: §4.6 — Plan FR-06, FR-07, D-3
import { useState } from "react";
import KeywordFilter from "./KeywordFilter";
import type { KeywordGroup } from "@/types/keyword";

interface Props {
  displayName: string;                // "Service"
  groups: KeywordGroup[];
  activeKeywords: Set<string>;        // slug set
  onToggle: (slug: string) => void;
}

export default function ServiceGroupSection({
  displayName,
  groups,
  activeKeywords,
  onToggle,
}: Props) {
  // Design Ref: §2.2 DS-3 — 로컬 UI-only state. null = 전부 접힘
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const toggleExpand = (groupName: string) => {
    // Plan D-3: 그룹 클릭 = 펼침만 (선택 아님)
    // Plan SC-04: activeKeywords 변화 없음
    setExpandedGroup((prev) => (prev === groupName ? null : groupName));
  };

  const expanded = groups.find((g) => g.group_name === expandedGroup);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="typo-h6 text-surface-900">{displayName}</h3>

      {/* 그룹 칩 행 */}
      <div className="flex flex-wrap gap-1">
        {groups.map((group) => (
          <KeywordFilter
            key={group.group_name}
            label={group.group_name}
            variant="filled"
            showChevron
            activated={expandedGroup === group.group_name}
            onClick={() => toggleExpand(group.group_name)}
          />
        ))}
      </div>

      {/* 펼쳐진 하위 키워드 행 */}
      {expanded && (
        <div className="flex flex-wrap gap-1 rounded-lg bg-surface-100 p-2">
          {expanded.keywords.map((k) => (
            <KeywordFilter
              key={k.slug}
              label={k.name}
              variant="filled"
              activated={activeKeywords.has(k.slug)}
              onClick={() => onToggle(k.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4.7 `KeywordFilter.tsx` (수정) — Plan D-7

```tsx
"use client";
// Design Ref: Plan D-7 — onRemove 확장으로 X 모드 지원
interface KeywordFilterProps {
  label: string;
  activated?: boolean;
  showChevron?: boolean;
  variant?: "outlined" | "filled";
  onClick?: () => void;
  onRemove?: () => void;   // 신규. 존재 시 X 모드
}

function ChevronDown({ className }: { className?: string }) { /* 기존 */ }

function XIcon({ className }: { className?: string }) {
  // Design Ref: Figma 374:10503 — size-2 (8px) X glyph inside size-4 wrapper
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={className}>
      <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function KeywordFilter({
  label,
  activated = false,
  showChevron = false,
  variant = "outlined",
  onClick,
  onRemove,
}: KeywordFilterProps) {
  const isRemovable = !!onRemove;
  // Plan FR-13: onRemove 있으면 activated 강제
  const effectiveActivated = isRemovable || activated;

  const defaultStyle =
    variant === "outlined"
      ? "bg-white border-[0.5px] border-surface-400 text-surface-800"
      : "bg-surface-200 text-surface-800";

  // Plan FR-13: onRemove 있으면 pr-[5px] (우측 좁힘)
  const paddingX = isRemovable ? "pl-[10px] pr-[5px]" : "px-[10px]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full ${paddingX} py-[6px] typo-caption capitalize transition-colors shrink-0 ${
        effectiveActivated ? "bg-secondary-400 text-white" : defaultStyle
      }`}
    >
      {label}
      {isRemovable && (
        // Plan FR-14: 원형 X 버튼, stopPropagation
        <span
          role="button"
          tabIndex={0}
          aria-label={`Remove ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove!();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              onRemove!();
            }
          }}
          className="flex items-center justify-center size-4 rounded-full bg-secondary-300 text-white"
        >
          <XIcon className="size-2" />
        </span>
      )}
      {showChevron && !isRemovable && <ChevronDown className="size-[13px]" />}
    </button>
  );
}
```

**주의**:
- `<button>` 안에 `<span role="button">`을 중첩한다. 브라우저가 `<button>` 안 `<button>`을 허용하지 않으므로 `span + role` 조합으로 시맨틱 유지.
- `e.stopPropagation()`로 상위 `onClick` 호출 차단.

### 4.8 `SearchHeader.tsx` (수정) — FR-10

기존 `activeKeywords`가 label string으로 쓰이던 부분을 slug로 바꾸되, **표시에는 name 사용**.

```tsx
// props에 filterSections 추가
interface SearchHeaderProps {
  filterSections: FilterSection[];
  activeKeywords: Set<string>;        // slug
  // ...
}

// 내부에서 slug → name 매핑 헬퍼
const allKeywords = useMemo(
  () => filterSections.flatMap((s) =>
    s.groups ? s.groups.flatMap((g) => g.keywords) : (s.keywords ?? []),
  ),
  [filterSections],
);
const getName = (slug: string) =>
  allKeywords.find((k) => k.slug === slug)?.name ?? slug;

// 렌더 시 Array.from(activeKeywords).map(getName) 사용
```

### 4.9 `supabase/seed/30_keywords.sql` (수정) — FR-08

기존 파일 끝의 `COMMIT;` 앞에 섹션 6 추가:

```sql
-- ═══════════════════════════════════════════════════════════════════
-- 6) keyword — Special Offers 카테고리 (Salon Features, 7개)
--    소스: filter-design-discussion.html §7 "Salon Features"
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.keyword (category_id, name, slug, group_name, display_order)
SELECT kc.id, v.name, v.slug, NULL, v.display_order
FROM public.keyword_category kc,
     (VALUES
        ('Foreigner Friendly', 'foreigner_friendly', 10),
        ('English-speaking',   'english_speaking',   20),
        ('Private Room',       'private_room',       30),
        ('Pet Friendly',       'pet_friendly',       40),
        ('Tax-free',           'tax_free',           50),
        ('Pregnancy-safe',     'pregnancy_safe',     60),
        ('Vegan Products',     'vegan_products',     70)
     ) AS v(name, slug, display_order)
WHERE kc.slug = 'special_offers'
ON CONFLICT (category_id, slug) DO NOTHING;
```

### 4.10 `.env.local.example` (신규)

```
# Supabase — Phase 1, anon key only (RLS는 후속 PDCA)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

`.gitignore`에 `.env.local`은 이미 포함되어 있다고 가정(Next.js 기본). 실제 `.env.local`은 커밋하지 않음.

---

## 5. State Flow

### 5.1 Click → State 전환

```
[User clicks keyword in Languages section]
  └─▶ KeywordFilter.onClick
        └─▶ CategoryBlock's () => onToggle(k.slug)
              └─▶ FilterPopup props.onToggle
                    └─▶ DiscoverClient.toggleKeyword(slug)
                          └─▶ setActiveKeywords(prev => toggle slug)
                                └─▶ React re-render
                                      ├─▶ SelectedKeywordsSection 노출/갱신
                                      └─▶ 해당 카테고리 칩 activated 상태 갱신
```

### 5.2 X button → Removal

```
[User clicks X inside Selected chip]
  └─▶ <span> onClick, stopPropagation
        └─▶ KeywordFilter props.onRemove()
              └─▶ SelectedKeywordsSection () => onRemove(k.slug)
                    └─▶ FilterPopup props.onRemove
                          └─▶ DiscoverClient.removeKeyword(slug)
                                └─▶ setActiveKeywords(prev => delete slug)
                                      └─▶ re-render
```

### 5.3 Service Group expand

```
[User clicks "Color" group chip]
  └─▶ KeywordFilter.onClick (activated = expandedGroup === "Color")
        └─▶ ServiceGroupSection.toggleExpand("Color")
              └─▶ setExpandedGroup("Color")  // 로컬, activeKeywords 무관
                    └─▶ 하위 키워드 패널 노출
```

---

## 6. UI Spec

### 6.1 Selected Keywords Section (Figma 374:10503)

- 컨테이너: `flex flex-col gap-2`
- 타이틀: `typo-h6 text-surface-900`, "Selected Keywords"
- 칩 행: `flex flex-wrap gap-1`
- 칩: `KeywordFilter` with `onRemove` — secondary-400 배경, white 텍스트, `pl-[10px] pr-[5px] py-[6px]`
- X 래퍼: `size-4 rounded-full bg-secondary-300`
- X 아이콘: `size-2` (8px SVG)

### 6.2 FilterPopup 레이아웃 순서

```
┌─ rounded-2xl bg-surface-50/95 backdrop-blur-[10px] ──┐
│                                                       │
│  [Selected Keywords] ← 조건부 렌더 (size > 0)         │
│                                                       │
│  [Language]                                           │
│  English  Korean  Chinese  ...                        │
│                                                       │
│  [Hair Type]                                          │
│  Straight  Wavy  Curly  Coily  ...                    │
│                                                       │
│  [Service]                                            │
│  [Cut]  [Color ▾]  [Perm]  [Braids & Locs] ...       │
│  ┌─ (Color 펼침 시) ─────────────────────────┐        │
│  │ Balayage  Coloring  Highlights  ...      │        │
│  └──────────────────────────────────────────┘        │
│                                                       │
│  [Salon Features]                                     │
│  Foreigner Friendly  Pet Friendly  ...                │
│                                                       │
└───────────────────────────────────────────────────────┘
```

섹션 간 `gap-6` (24px). 내부 타이틀-칩은 `gap-2` (8px). 칩 사이 `gap-1` (4px).

---

## 7. API/Data Contract

| 함수 | 위치 | Input | Output |
|------|------|-------|--------|
| `getFilterKeywords()` | `src/lib/keywords.ts` | — | `Promise<FilterSection[]>` (길이 4, 순서 고정) |
| `toggleKeyword(slug)` | `DiscoverClient` | `string` | `void` — activeKeywords Set 토글 |
| `removeKeyword(slug)` | `DiscoverClient` | `string` | `void` — activeKeywords Set에서 삭제 |

---

## 8. Test Plan

런타임 자동 테스트 도입은 후속 PDCA. 이번엔 **수동 검증 체크리스트**.

| ID | Plan SC | 시나리오 | 기대 결과 |
|----|---------|----------|-----------|
| T-01 | SC-01 | `rg "FILTER_CATEGORIES" src/` | 0건 |
| T-02 | SC-02 | Discover 탭에서 필터 팝업 열기 | 4개 h3 타이틀: Language, Hair Type, Service, Salon Features |
| T-03 | SC-03 | 네트워크 탭 | keyword_category 응답에 4개 카테고리, keyword 총 50+ 개 |
| T-04 | SC-04 | Service "Color" 탭 클릭 | Selected Keywords 섹션 미등장, activeKeywords 크기 0 유지 |
| T-05 | SC-05 | "Color" 펼침 후 "Balayage" 클릭 | activeKeywords에 "balayage" 추가 |
| T-06 | SC-06 | Hair Concern 등 섹션 타이틀 탐색 | 없음 |
| T-07 | SC-07 | `SELECT COUNT(*) FROM keyword WHERE category_id=(SELECT id FROM keyword_category WHERE slug='special_offers')` | 7 |
| T-08 | SC-08 | `rg "#[0-9a-f]{6}" src/app/(main)/discover/components/FilterPopup.tsx` | 0 |
| T-09 | SC-09 | activeKeywords 0개 상태 | DOM에 "Selected Keywords" 타이틀 없음 |
| T-10 | SC-10 | 2개 선택 후 하나만 X | 나머지 1개만 남음 |
| T-11 | SC-11 | DevTools로 Selected 칩 스타일 확인 | `bg-secondary-400`, X 래퍼 `bg-secondary-300` |
| T-12 | — | Service "Color" 펼친 상태에서 "Cut" 클릭 | Color 접히고 Cut 하위 펼침 (한 번에 한 그룹) |
| T-13 | — | 팝업 닫고 재오픈 | `expandedGroup === null` (전부 접힘 상태로 초기화) |

---

## 9. Risks & Mitigations

(Plan §6을 승계하며, Design 단계에서 구체화)

| 리스크 | 완화 설계 |
|--------|----------|
| Supabase env 누락 | §4.1 `src/lib/supabase.ts` 최상단 throw (DS-6). `.env.local.example` 커밋 |
| `page.tsx` Server 전환 중 기존 Client 로직 누락 | `DiscoverClient.tsx` 신설로 기존 코드 그대로 이전, 이 과정에서 `activeKeywords` slug 마이그레이션 1회만 수행 |
| `<button>` 안에 X `<button>` 중첩 → HTML 위반 | §4.7: X는 `<span role="button">` + keyboard handler로 접근성 유지 |
| 서버 응답 shape 변경 시 클라 타입 불일치 | `FilterSection` 타입을 `@/types/keyword`에 단일 정의, 서버/클라 공유 |
| treatment 그룹 순서 불일치 (Cut이 Color보다 뒤로) | §4.2 `groupByGroupName`가 각 그룹의 **min display_order**로 정렬 |

---

## 10. Success Criteria

Plan §5의 SC-01 ~ SC-11을 그대로 승계. Design 단계에서 추가:

| ID | 기준 |
|----|------|
| SC-12 | `getFilterKeywords()` 단위 검증: 반환 배열 길이 4, `treatment`만 `groups` 필드 존재, 나머지는 `keywords` 필드 존재 |
| SC-13 | `page.tsx`에 `"use client"` 지시어 **없음** (Server 전환 확인) |
| SC-14 | `DiscoverClient.tsx` 존재, `"use client"` 포함, `activeKeywords` 상태 보유 |

---

## 11. Implementation Guide

### 11.1 파일 변경 요약

| 경로 | 액션 | 예상 라인 |
|------|------|-----------|
| `supabase/seed/30_keywords.sql` | 수정 (섹션 6 추가) | +25 |
| `.env.local.example` | 신규 | ~5 |
| `package.json` | 수정 (@supabase/supabase-js 추가) | +1 |
| `src/lib/supabase.ts` | 신규 | ~15 |
| `src/lib/keywords.ts` | 신규 | ~70 |
| `src/types/keyword.ts` | 신규 | ~50 |
| `src/app/(main)/discover/page.tsx` | 재작성 (Server 전환) | -50 + ~10 |
| `src/app/(main)/discover/DiscoverClient.tsx` | 신규 (기존 page 로직 이전) | ~65 |
| `src/app/(main)/discover/components/FilterPopup.tsx` | 재작성 | -30 + ~70 |
| `src/app/(main)/discover/components/SelectedKeywordsSection.tsx` | 신규 | ~40 |
| `src/app/(main)/discover/components/ServiceGroupSection.tsx` | 신규 | ~55 |
| `src/app/(main)/discover/components/KeywordFilter.tsx` | 수정 (onRemove) | +30 |
| `src/app/(main)/discover/components/SearchHeader.tsx` | 수정 (slug 대응) | +15 ~ +25 (기존 로직에 따라) |
| **총** | | **~350 lines 추가 / ~80 lines 제거** |

### 11.2 구현 순서

Plan §7의 8단계를 Design 기준으로 세분화:

| Step | Module | 내용 |
|------|--------|------|
| 1 | **Setup** | `pnpm add @supabase/supabase-js`, `src/lib/supabase.ts`, `src/types/keyword.ts`, `.env.local.example` |
| 2 | **Seed** | `supabase/seed/30_keywords.sql` 섹션 6 추가, `supabase db reset` 로컬 검증 |
| 3 | **Fetch** | `src/lib/keywords.ts` 작성 + shape 함수 단위 확인 (콘솔 로그) |
| 4 | **Server/Client split** | `page.tsx` Server 전환 + `DiscoverClient.tsx` 신설, 동작 동일 확인 (아직 기존 하드코딩 사용) |
| 5 | **FilterPopup refactor** | 하드코딩 제거, `filterSections` props 사용, 4개 카테고리만 렌더 (treatment는 임시로 평면 렌더) |
| 6 | **ServiceGroupSection** | `ServiceGroupSection.tsx` 신규, FilterPopup에서 treatment일 때 분기 |
| 7 | **KeywordFilter 확장** | `onRemove` prop 추가, X 버튼 시맨틱 처리 |
| 8 | **SelectedKeywordsSection** | 신규 컴포넌트, FilterPopup 최상단 |
| 9 | **slug 마이그레이션** | `DiscoverClient`/`SearchHeader`에서 activeKeywords를 slug로 취급 |
| 10 | **수동 검증** | §8 T-01 ~ T-13 체크 |

### 11.3 Session Guide

각 모듈을 독립 세션으로 분리 가능. `/pdca do filter-popup-redesign --scope module-N` 형태로 호출.

| Module | Scope key | Steps | 독립 실행 가능? |
|--------|-----------|-------|------------------|
| M1: Infra | `infra` | 1, 2 | ✅ (네트워크/DB만 터치) |
| M2: Data Layer | `data` | 3 | ✅ (M1 완료 후) |
| M3: Server/Client Split | `split` | 4 | ✅ (M2 완료 후, UI 동일) |
| M4: Category Refactor | `category` | 5, 6 | ✅ (M3 완료 후, Selected 섹션 제외) |
| M5: Selected Section + KeywordFilter | `selected` | 7, 8, 9 | ✅ (M4 완료 후) |
| M6: Verification | `verify` | 10 | ✅ (M5 완료 후) |

**권장 세션 분할**: M1+M2 (infra+data) → M3+M4 (split+category) → M5+M6 (selected+verify). 각 세션 끝마다 `pnpm dev`로 시각 확인 가능한 지점.

---

## 12. 관련 문서

- [Plan](../../01-plan/features/filter-popup-redesign.plan.md)
- [Filter Design Discussion](../../../public/docs/filter-design-discussion.html) (§7 목업)
- [Figma — Selected Keywords](https://www.figma.com/design/1EccDx1qvrkFZBsNEFbWjj/Batch1_Design?node-id=374-10503)
- [Phase 1 SQL Plan](../../01-plan/features/phase1-sql.plan.md)
- [Discover CLAUDE.md](../../../src/app/(main)/discover/CLAUDE.md)

---

## 13. 다음 단계

- `/pdca do filter-popup-redesign` (전체 스코프, ~350 lines 추가/-80)
- 또는 세션 분할: `/pdca do filter-popup-redesign --scope infra,data` 먼저 → 확인 → 다음 세션에서 `--scope split,category`
