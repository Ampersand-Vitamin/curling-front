# Filter Popup Redesign — Discover 필터 DB 연동 개편

> **Created**: 2026-04-21
> **Status**: Draft
> **Feature**: filter-popup-redesign
> **Phase**: Plan
> **Ref**: `public/docs/filter-design-discussion.html`

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | FilterPopup이 10개 카테고리 60+ 키워드를 하드코딩하고 있고, 이 중 절반 이상(Hair Color/Length/Concern/Treatment History)이 "고객 프로필" 성격이라 디자이너·살롱 데이터와 정확 매칭되지 않아 Discover 탭의 "정량 필터" 역할이 성립하지 않는다. 또한 선택한 키워드를 팝업 내부에서 한눈에 보거나 개별 해제할 UI가 없어, 유저가 스크롤하며 선택 상태를 일일이 뒤져야 한다. |
| **Solution** | 디자인 논의서의 4개 카테고리 구조(Language / Hair Type / Service / Salon Features)로 축소하고, Supabase `keyword_category` + `keyword` 테이블에서 실시간 조회하여 DB ↔ UI 키워드가 한 소스에서 관리되도록 한다. Service는 그룹 칩 2단계 펼침(그룹 탭 = 펼침, 선택은 하위)으로 구현. 팝업 상단에 "Selected Keywords" 섹션을 두어 활성 키워드를 한눈에 보여주고 각 칩의 X 버튼으로 개별 해제한다. |
| **기능 UX 효과** | 유저가 선택한 키워드가 실제 디자이너/살롱의 `designer_keyword`/`salon_keyword`와 1:1 매칭되므로 "English 가능 + Curly 전문 + Balayage" 같은 정확 조건 검색이 성립하고, 관리자가 DB 키워드를 수정하면 UI가 자동 반영된다. |
| **핵심 가치** | FilterPopup을 `/pdca phase1-sql`에서 완성한 Supabase 스키마 위에 올려, Discover 탭이 Mock이 아닌 실제 DB 기반으로 동작하는 첫 번째 사용자 플로우가 된다. |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | Discover 탭을 "정량 필터" 역할로 확립하기 위해 필터 키워드와 디자이너/살롱 키워드를 동일한 `keyword` 테이블에서 관리. Discover·Style 탭 역할 분리(논의서 §1)의 첫 구현. |
| **WHO** | 주변 살롱/디자이너를 정확 조건으로 필터링하려는 고객, DB 키워드를 관리할 운영자. |
| **RISK** | (1) Supabase 클라이언트 최초 도입이라 env 설정 실수 가능성, (2) Server Component → Client props 전달 시 Set 직렬화/Date 필드 이슈, (3) Service 그룹 펼침 상태와 activeKeywords 상태 분리 실패 시 UX 혼란, (4) 키워드 이름 변경 시 activeKeywords에 남아있는 stale label로 필터 깨짐. |
| **SUCCESS** | FilterPopup이 **Selected Keywords 섹션 + 4개 카테고리 섹션**을 렌더하고 모든 키워드가 `keyword` 테이블에서 온다(하드코딩 0). Service 섹션에서 그룹 탭 클릭 → 하위 키워드 펼침, 하위 키워드 클릭 → activeKeywords 토글. Selected Keywords 섹션의 X 버튼 클릭 → 해당 키워드만 해제. `pnpm dev`에서 Supabase 연결 상태로 44개 키워드 + 신규 Salon Features 키워드가 정상 표시. |
| **SCOPE** | IN: Supabase 클라이언트 셋업, keyword fetch 레이어, FilterPopup UI 4카테고리 재구성, Service 2단계 펼침, Salon Features 키워드 시드 추가, **Selected Keywords 상단 섹션 + 개별 해제 칩**. OUT: Recommended 섹션, My 탭 Hair Profile, 실제 마커/리스트 필터링 로직(키워드 → 디자이너 쿼리), activeKeywords 영속화, "Clear all" 전체 해제 버튼. |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | Supabase 클라이언트 초기 세팅 (`@supabase/supabase-js` 설치 + `src/lib/supabase.ts` + 환경변수) | Must |
| FR-02 | `src/lib/keywords.ts`에 `getKeywordsGroupedByCategory()` 서버 함수 추가 — `keyword_category` + `keyword`를 JOIN하여 카테고리별 그룹핑된 형태로 반환 | Must |
| FR-03 | `page.tsx`(Server Component)에서 keyword 데이터를 fetch하여 FilterPopup에 props로 전달 | Must |
| FR-04 | FilterPopup 상단 하드코딩 `FILTER_CATEGORIES` 상수 **완전 제거** | Must |
| FR-05 | FilterPopup이 **4개 카테고리만** 렌더: `languages`, `hair_type`, `treatment`(표시명 "Service"), `special_offers`(표시명 "Salon Features") — 카테고리 필터링은 slug 기반 | Must |
| FR-06 | Service(`treatment`) 섹션은 `keyword.group_name`으로 2단계 그룹핑하여 렌더 (Cut / Color / Perm / Braids & Locs / Care / Barber) | Must |
| FR-07 | Service 그룹 탭 UX: 그룹 칩 클릭 = 해당 그룹의 하위 키워드만 펼침 (**선택 아님**), 하위 키워드 클릭 = activeKeywords 토글. 한 번에 한 그룹만 펼쳐지거나 전부 접힌 상태 | Must |
| FR-08 | `supabase/seed/30_keywords.sql`에 `special_offers` 카테고리 키워드 시드 추가 (논의서 §7 기준) | Must |
| FR-09 | `activeKeywords` 자료형을 `Set<string>`(label) → `Set<string>`(keyword.slug)로 변경 — label은 다국어/리네임에 취약하므로 slug를 soft-stable ID로 사용 | Should |
| FR-10 | 기존 `SearchHeader`에서도 activeKeywords를 slug로 취급하도록 연쇄 수정 (label 표시는 slug → name 매핑으로) | Must |
| FR-11 | DB에 `hair_concern` / `hair_color` / `hair_length` / `treatment_history` / `style` 카테고리 키워드가 있어도 FilterPopup에서는 **렌더하지 않는다** (논의서 §2: 고객 프로필은 My 탭 이관) | Must |
| FR-12 | FilterPopup **최상단**에 "Selected Keywords" 섹션 추가 — 활성 키워드가 1개 이상이면 `typo-h6` 타이틀 + 칩 리스트 표시. 0개면 섹션 **자체 숨김** | Must |
| FR-13 | `KeywordFilter` 컴포넌트에 **`onRemove?: () => void`** prop 추가. `onRemove`가 주어지면 activated 스타일 강제 + 우측 패딩 `pr-[5px]` + chevron 대신 X 버튼 렌더 | Must |
| FR-14 | X 버튼 스타일 (Figma 374:10503): `bg-secondary-300` 원형 래퍼 `size-4` 안에 `size-2` X 아이콘. 버튼 자체에 `onClick={(e) => { e.stopPropagation(); onRemove(); }}`로 칩 전체 onClick과 분리. 클릭 시 해당 keyword.slug만 activeKeywords에서 제거 | Must |
| FR-15 | Selected Keywords 표시 순서는 **유저가 선택한 순서**(Set 삽입 순서). 정렬 재배치 없음 | Should |
| FR-16 | Selected Keywords 섹션과 아래 카테고리 섹션 사이 구분자(divider 또는 `gap-6` 이상) | Should |

### 1.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|---------|------|
| NFR-01 | 디자인 토큰 준수 | 하드코딩 색상/폰트 금지. `surface-*`, `primary-*`, `secondary-*`, `typo-*` 유틸리티만 사용 (CLAUDE.md 규칙) |
| NFR-02 | 기존 `KeywordFilter` 컴포넌트 재사용 | `variant="filled"` + `activated` 조합 유지, 그룹 칩용 `variant`/스타일은 최소 추가만 |
| NFR-03 | 초기 렌더 즉시 키워드 노출 | Server Component fetch로 로딩 스피너/스켈레톤 불필요 |
| NFR-04 | env 변수 명명 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Next.js + Supabase 관례) |
| NFR-05 | 타입 안정성 | `KeywordCategory`, `Keyword` 타입을 `src/types/keyword.ts`로 정의 (DB 스키마 1:1 대응) |

### 1.3 범위 제외 (Out of Scope)

- **Recommended 섹션** (유저 프로필 기반 추천) — 논의서 §5, 별도 PDCA
- **My 탭 Hair Profile** — 논의서 §2에서 빠진 카테고리들의 이전 대상지, 별도 PDCA
- **실제 필터링 로직** — 선택한 keyword로 디자이너/살롱을 쿼리하는 부분은 `/discover` 탭의 다음 PDCA (이번엔 FilterPopup의 "선택 상태 관리"까지만)
- **activeKeywords URL persist / 세션 유지** — 현재도 없으니 유지
- **Supabase Auth / RLS** — phase1-sql.plan.md에서 Phase 2로 이관됨
- **Storybook stories 업데이트** — 필요 시 후속 PDCA
- **i18n** (`src/messages/`) — 카테고리 표시명 "Service", "Salon Features" 하드코딩 (추후 i18n 이관)

---

## 2. 데이터 모델 (기존 스키마 재사용)

### 2.1 읽기 대상 테이블

| 테이블 | 용도 | 비고 |
|--------|------|------|
| `keyword_category` | FilterPopup 섹션 마스터 | slug로 필터링 (`IN (...)`), `display_order`로 정렬 |
| `keyword` | 각 섹션의 칩 | `category_id` JOIN, `group_name` 별 그룹핑, `display_order`로 정렬 |

### 2.2 시드 추가 대상 (FR-08)

`supabase/seed/30_keywords.sql`에 아래 섹션 추가:

```sql
-- 6) keyword — Special Offers 카테고리 (Salon Features)
--    소스: 디자인 논의서 §7 "Salon Features"
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

> 정확한 키워드 목록은 Design phase에서 `salons.json`과 교차 검증 후 확정. 여기선 논의서 초안.

### 2.3 쿼리 예시

```sql
SELECT
  kc.slug AS category_slug,
  kc.name AS category_name,
  kc.display_order AS category_order,
  k.id, k.name, k.slug, k.group_name, k.display_order
FROM keyword_category kc
LEFT JOIN keyword k ON k.category_id = kc.id
WHERE kc.slug IN ('languages', 'hair_type', 'treatment', 'special_offers')
ORDER BY kc.display_order, k.group_name NULLS FIRST, k.display_order;
```

반환 구조(TS):

```ts
type KeywordCategoryWithKeywords = {
  slug: string;
  name: string;
  keywords: Keyword[];          // display_order 순
  groups?: { group_name: string; keywords: Keyword[] }[]; // treatment만 채워짐
};
```

---

## 3. 파일 구조 (예상)

```
supabase/seed/
  30_keywords.sql                              # Special Offers 시드 추가 (FR-08)

src/
  lib/
    supabase.ts                                # 신규 — 서버/클라 Supabase 클라이언트 (FR-01)
    keywords.ts                                # 신규 — getKeywordsGroupedByCategory() (FR-02)
  types/
    keyword.ts                                 # 신규 — Keyword, KeywordCategory 타입 (NFR-05)
  app/(main)/discover/
    page.tsx                                   # 수정 — Server Component에서 fetch (FR-03)
    components/
      FilterPopup.tsx                          # 수정 — 4카테고리 렌더, 하드코딩 제거 (FR-04, FR-05)
      ServiceGroupSection.tsx                  # 신규 — Service 2단계 펼침 전담 (FR-06, FR-07)
      SelectedKeywordsSection.tsx              # 신규 — 상단 선택 키워드 섹션 (FR-12, FR-15, FR-16)
      KeywordFilter.tsx                        # 수정 — onRemove prop 추가로 X 삭제 모드 지원 (FR-13, FR-14)
      SearchHeader.tsx                         # 수정 — activeKeywords slug 대응 (FR-10)

.env.local.example                             # 신규 — Supabase env 예시
```

구체 파일 조정은 Design phase에서 확정.

---

## 4. 핵심 설계 결정 (Checkpoint 확정)

| # | 결정 | 대안 대비 이유 |
|---|------|--------------|
| D-1 | Supabase 클라이언트 셋업 **이 PDCA에 포함** | 단일 단위로 "DB 연동 필터"가 완결. 분리 시 mock shim 필요 → 낭비 |
| D-2 | Fetch 전략: **Server Component 초기 fetch → Client props** | 키워드는 stale이 거의 없어 서버 렌더 캐싱이 최적. 클라이언트 로딩 상태 불필요 |
| D-3 | Service 그룹 UX: **그룹 탭 = 펼침만, 선택은 하위에서** | 논의서 §3/§7 화면 목업과 1:1 일치. 그룹 선택 ≠ 전체 선택으로 정확 매칭 유지 |
| D-4 | Salon Features: **이 PDCA에서 시드 추가** | 빈 섹션으로 두면 FR-05의 "4카테고리 렌더"가 3개로 줄어 검증 범위 축소 |
| D-5 | activeKeywords 키: **`keyword.slug` 사용** | label(다국어/리네임 취약) < slug(안정적 식별자) < id(UUID, 과한 노출). slug는 hex-stable하면서 사람이 읽을 수 있음 |
| D-6 | Selected Keywords 섹션 **0개 시 숨김** | 빈 타이틀만 보이는 것 방지. 첫 선택 시 자연스럽게 등장하며 "지금 뭘 걸었는지" 즉시 인지 (Figma 374:10503은 항상 값이 있는 상태만 스냅샷) |
| D-7 | Selected Keywords 칩은 **`KeywordFilter`에 `onRemove` prop 추가로 확장** | 시각 토큰(`bg-secondary-400` + `text-white` + `typo-caption` + `rounded-full`)이 `KeywordFilter`의 `activated=true` 상태와 100% 동일. 유일한 차이는 우측 아이콘(chevron ↔ X)과 그 클릭 핸들러. 별도 컴포넌트는 중복. `onRemove` 제공 시: (1) 활성 스타일 강제, (2) 우측 패딩 `pr-[5px]`, (3) chevron 대신 `secondary-300` 원형 X 버튼 렌더, (4) 버튼 클릭 이벤트는 `stopPropagation()`으로 상위 `onClick`과 분리 |

---

## 5. 성공 기준

| ID | 기준 | 측정 방법 |
|----|------|---------|
| SC-01 | FilterPopup에 하드코딩 `FILTER_CATEGORIES` 상수가 존재하지 않음 | `grep -r "FILTER_CATEGORIES" src/` → 0건 |
| SC-02 | 렌더된 카테고리 섹션이 정확히 4개 (Language / Hair Type / Service / Salon Features) | Storybook 또는 `pnpm dev`에서 시각 확인 + DOM 섹션 개수 |
| SC-03 | 44개 기존 키워드 + 신규 Salon Features 키워드가 정상 노출 | 네트워크 탭에서 `keyword` 테이블 응답 행 수 확인 |
| SC-04 | Service 섹션에서 그룹 칩 클릭 시 하위만 펼쳐지고 activeKeywords 크기는 **변하지 않음** | 수동 테스트 — 그룹 클릭 후 `activeKeywords.size` 변화 없음 |
| SC-05 | 하위 키워드 클릭 시 slug가 activeKeywords에 토글됨 | React DevTools로 상태 확인 |
| SC-06 | DB에 있는 `hair_concern` 등 5개 카테고리는 FilterPopup에 **렌더되지 않음** | 화면에 해당 섹션 타이틀 미노출 |
| SC-07 | `supabase db reset` 후 `special_offers` 카테고리에 7개 키워드 존재 | `SELECT COUNT(*) FROM keyword WHERE category_id = (SELECT id FROM keyword_category WHERE slug='special_offers')` ≥ 7 |
| SC-08 | CLAUDE.md 디자인 토큰 규칙 준수 | `grep -E "#[0-9a-f]{3,6}\|\[[0-9]+px\]" src/app/(main)/discover/components/FilterPopup.tsx` → 없음 (기존 잔존 hardcode는 제외) |
| SC-09 | activeKeywords가 0개일 때 "Selected Keywords" 섹션이 DOM에 **존재하지 않음** | 수동 확인 또는 DOM 쿼리 |
| SC-10 | activeKeywords가 1개 이상일 때 상단에 섹션이 나타나고, 각 칩의 X 버튼 클릭 시 해당 slug만 제거됨 | 수동 테스트 — 2개 선택 후 1개 X → 나머지 1개 유지 확인 |
| SC-11 | Selected Keywords 칩 스타일이 Figma 374:10503과 일치 (`secondary-400` 배경, `secondary-300` X 래퍼, `typo-caption`) | 시각 비교 + 토큰 grep |

---

## 6. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| Supabase env 미설정 시 서버 렌더 실패 → 500 에러 | Discover 탭 전체 다운 | `src/lib/supabase.ts`에서 env 누락 시 **빌드타임 에러**(createClient는 URL undefined면 throw)로 조기 발견 + `.env.local.example` 커밋 |
| Service 그룹 펼침 상태와 activeKeywords 혼선 | 그룹 클릭으로 의도치 않은 선택 발생 | 그룹 펼침용 `expandedGroup` local state를 activeKeywords와 **완전히 분리**. D-3 결정 명시 |
| activeKeywords의 소스 변경(label → slug)으로 `SearchHeader` 표시 깨짐 | 활성 키워드 표시 이상 | slug → name 매핑 헬퍼 `getKeywordName(slug)` 추가. 전달받은 키워드 리스트에서 조회 |
| `special_offers` 키워드를 `salon_keyword` 테이블에 부여하지 않은 상태에서 필터 선택 시 결과 0건 | 유저 혼란 | 이번 스코프는 "UI만"이므로 실 필터링 결과 0건은 OK — 다음 PDCA에서 `salon_keyword` 시드 추가 |
| Server Component에서 fetch한 데이터가 Client로 넘어갈 때 Date 직렬화 | 런타임 에러 | `keyword` 테이블에 Client가 사용하는 Date 필드 없음 — created_at은 Server 쪽에서 drop |
| `pnpm build` 시 `NEXT_PUBLIC_SUPABASE_URL` 없으면 실패 | 배포 블록 | `.env.local.example` 제공 + README 또는 design doc에 세팅 순서 명시 |
| Selected Keywords 섹션 추가로 활성 키워드가 **두 곳에 중복 노출**(상단 + 각 카테고리 섹션 내 activated 칩) | 시각적 혼란 | 의도된 중복. 상단은 "현재 선택 한눈에 + 해제", 하단은 "카테고리 내 선택 상태 표시". 디자인 논의서 §7 목업도 동일 구조 |
| 선택 키워드가 많을 때 팝업 상단 공간 점유 과다 | 카테고리 영역 축소 | FilterPopup은 `overflow-y-auto` 상태라 스크롤로 흡수. 10개 이상 선택은 현실적으로 드물어 허용 |

---

## 7. 작업 단계 (Design phase에서 세분화)

| Step | 산출물 | 확인 포인트 |
|------|--------|------------|
| 1 | Supabase 클라이언트 + env + 타입 | `createClient()` 동작, 타입 정의 완성 |
| 2 | `getKeywordsGroupedByCategory()` + `special_offers` 시드 추가 | SQL 쿼리 결과가 기대 구조와 일치 |
| 3 | `page.tsx` Server fetch + props 전달 | Network 탭에서 초기 HTML에 키워드 포함 확인 |
| 4 | FilterPopup 4카테고리 렌더 + 하드코딩 제거 | 4개 섹션만 보임 |
| 5 | `ServiceGroupSection` 신규 컴포넌트 + 그룹 펼침 UX | D-3 동작 |
| 6 | `KeywordFilter`에 `onRemove` prop 확장 + `SelectedKeywordsSection` 신규 상단 섹션 (FR-12 ~ FR-16) | Figma 374:10503과 시각 일치, SC-09 ~ SC-11. 카테고리 섹션 기존 동작에 회귀 없음 |
| 7 | `activeKeywords` slug 마이그레이션 (`page.tsx`, `SearchHeader.tsx`, `FilterPopup.tsx`) | SC-05 |
| 8 | 수동 검증 (SC-01~SC-11) | 체크리스트 모두 ✅ |

Design phase에서 각 Step의 파일별 diff 규모와 3가지 아키텍처 옵션(Option A 최소 변경 / B Clean / C Pragmatic)을 제시.

---

## 8. 관련 문서

- [Filter Design Discussion](../../../public/docs/filter-design-discussion.html) — 4카테고리 축소, 그룹 UX 근거
- [Figma — Selected Keywords](https://www.figma.com/design/1EccDx1qvrkFZBsNEFbWjj/Batch1_Design?node-id=374-10503) — 상단 섹션 + X 해제 칩 디자인 (node 374:10503)
- [Phase 1 SQL Plan](./phase1-sql.plan.md) — keyword 테이블/시드 소스
- [Discover CLAUDE.md](../../../src/app/(main)/discover/CLAUDE.md) — Discover 탭 작업 맥락
- [Project CLAUDE.md](../../../CLAUDE.md) — 디자인 토큰/Git 규칙

---

## 9. 다음 단계

- `/pdca design filter-popup-redesign` — 3가지 아키텍처 옵션 비교 (Option A: FilterPopup 내부만 수정 / Option B: ServiceGroupSection 분리 + keyword 서비스 레이어 / Option C: Zustand 전역 캐시 기반) 후 선택 확정
- Design 승인 후 `/pdca do filter-popup-redesign`
