# Discover — 작업 맥락

## 현재 상태

Discover는 **탭 1 (메인 탭)**이며, 지도 기반 디자이너/살롱 탐색 화면.
현재 맵뷰 + PullBar(바텀시트) + 디자이너 캐러셀 기본 구조가 완성됨.

## 컴포넌트 구조

```
page.tsx                    # 맵뷰 + ViewToggle + PullBar 조합
components/
  MapView.tsx               # 지도 (placeholder 상태)
  ViewToggle.tsx            # 맵/리스트 전환 토글
  PullBar.tsx               # 3단계 바텀시트 (collapsed/compact/expanded)
  KeywordFilter.tsx         # 필터 칩 (activated/default)
  DesignerCarousel.tsx      # 수평 스크롤 디자이너 카드 리스트
  DesignerCard.tsx          # 디자이너 카드 (small/medium/large)
  LanguageTag.tsx           # 언어 태그 (국기 + 텍스트)
```

## IA 기준 남은 작업

- [ ] 검색 (`search/page.tsx`) — Text Search, Filter Search
- [ ] 살롱 상세 (`salon/[salonId]/page.tsx`)
- [ ] 디자이너 상세 (`designer/[designerId]/page.tsx`)
- [ ] 아티클/가이드 (`article/page.tsx`, `article/[slug]/page.tsx`)
- [ ] 맵 실제 연동 (Kakao/Google Maps)
- [ ] 리스트 뷰 모드
- [ ] Best Match / Nearest 정렬
- [ ] Featured Salon 섹션
- [ ] Designer/Salon 모드 전환

## 주의사항

- 색상은 반드시 디자인 토큰 사용 (`primary-*`, `surface-*`, `secondary-*`, `accent-*`, `alert-*`)
- 타이포는 `typo-h1` ~ `typo-button` 유틸리티 클래스 사용
- 기존 컴포넌트에 하드코딩된 `text-[24px]` 등은 Figma 하이파이 확정 후 토큰으로 교체 예정
- DesignerCard, KeywordFilter 등은 Storybook stories 존재 (`src/stories/`)
- PullBar는 포인터 드래그 기반 3단계 스냅 — `collapsed(0px)`, `compact(260px)`, `expanded(440px)`
- Mock 데이터는 `DesignerCarousel.tsx` 내 `MOCK_DESIGNERS`에 있음

## 관련 ERD Entity

- User, DesignerProfile, Salon, Portfolio
- KeywordCategory, Keyword, DesignerKeyword
- Favorite, Article
