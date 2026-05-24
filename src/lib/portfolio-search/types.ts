// portfolio_search 라이브러리 타입.
// 런타임 검색의 입출력 형태. UI 측 Style 도메인 타입과는 별도.
//
// search_portfolios RPC 의 RETURNS TABLE 과 1:1 대응.

// Design Ref: §3 — Option B (CLIP unified). text-embedding-3-large 대체.
export const EMBED_MODEL = "Xenova/clip-vit-large-patch14" as const;
export const EMBED_DIMENSIONS = 768 as const;
export const RPC_NAME = "search_portfolios" as const;

/** RPC 의 raw 반환 row (snake_case) */
export type PortfolioRpcRow = {
  id: string;
  designer_id: string;
  image_path: string;
  title: string;
  description: string | null;
  keywords: string[];
  display_name: string | null;
  profile_image_url: string | null;
  salon_id: string | null;
  salon_name: string | null;
  rating_avg: number | null;
  score: number;
};

/** 변환 후 도메인 hit (camelCase, storageUrl 적용 완료) */
export type PortfolioSearchHit = {
  portfolioId: string;
  designerId: string;
  /** 카드 메인 이미지 — storageUrl() 적용 완료 */
  coverImageUrl: string;
  title: string;
  description: string | null;
  keywords: string[];
  displayName: string;
  /** storageUrl() 적용 완료, 없으면 null */
  profileImageUrl: string | null;
  salonId: string | null;
  salonName: string | null;
  ratingAvg: number;
  score: number;
};

export type PortfolioSearchParams = {
  q: string;
  /** keyword.slug 배열. 빈 배열/undefined 면 필터 없음 */
  keywordSlugs?: string[];
  limit?: number;
  /** offset (간단 페이지네이션) */
  cursor?: number;
};

export type PortfolioSearchResult = {
  hits: PortfolioSearchHit[];
  nextCursor: number | null;
  query: string;
  appliedFilters: string[];
};
