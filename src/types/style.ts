// Style 탭 검색의 UI/공유 타입.
// 서버/클라이언트 양쪽에서 import (값 X, 타입만).

export type StyleSearchParams = {
  q: string;
  /** 추천 칩 또는 추후 필터 패널에서 누적된 keyword.slug. */
  keywordSlugs?: string[];
  limit?: number;
  /** offset 페이지네이션. 다음 페이지는 응답의 nextCursor. */
  cursor?: number;
  /** Meilisearch hybrid: 0=BM25만 / 1=벡터만 / 0.5=균형. 빈 쿼리 + 키워드 0 인 경우 0 으로 강등. */
  semanticRatio?: number;
};

export type StylePortfolioCard = {
  /** portfolio.id — 카드/이미지 단위 식별자 */
  id: string;
  /** designer_profile.id — /designer/[designerId] 상세 라우트용 */
  designerId: string;
  displayName: string;
  role: string;
  salonName: string | null;
  /** storageUrl() 적용 완료 — 그대로 <img src=> 가능. 없으면 placeholder URL. */
  coverImageUrl: string;
  profileImageUrl: string | null;
  /** 1라운드 false 고정 (favorite 테이블 미도입). */
  isFavorited: boolean;
};

export type StyleSearchResult = {
  hits: StylePortfolioCard[];
  totalEstimated: number;
  nextCursor: number | null;
  query: string;
  appliedFilters: string[];
};

/** 추천 칩 1라운드 모델 — Figma 기준 하드코딩. */
export type RecommendedKeyword = {
  /** keyword.slug 와 1:1 — Meili filter 에 그대로 사용 */
  slug: string;
  /** UI 표시 라벨 (Figma 의 표기 그대로). */
  label: string;
};
