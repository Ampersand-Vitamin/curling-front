// Design Ref: §3.1 — designer-detail
// Plan FR-03
//
// 외부에서는 src/lib/designers/index.ts 의 re-export만 import.
// snake_case Raw 행은 queries.ts/list.ts 내부 private 으로 처리되고,
// 외부 노출은 모두 camelCase 도메인 모델.

export type DesignerKeyword = {
  slug: string;
  name: string;
  /** 'treatment' | 'languages' | 'hair_type' | 'amenities' | 'inclusivity' | ... */
  categorySlug: string;
};

export type DesignerPortfolioPreview = {
  imagePath: string;
  keywordSlugs: string[];
};

/** 캐러셀/리스트용 경량 모델 (Best Match for you, 향후 검색 결과 등) */
export type DesignerListItem = {
  id: string;
  displayName: string;
  role: string;
  profileImageUrl: string | null;
  /** Hero 첫 슬라이드 = portfolioImages[0]. 시드 규칙상 최소 1개 보장 */
  portfolioImages: string[];
  /** Discover 필터 문맥에 맞는 카드 배경 선택용 portfolio rows */
  portfolioPreviews: DesignerPortfolioPreview[];
  languages: string[];
  highlightMessage: string | null;
  /** 소속 살롱 id — Discover 디자이너 핀 클릭 시 살롱 단위 필터링용 */
  salonId: string | null;
  /** 살롱 위치 — DesignerCarousel 거리 정렬용. 살롱 미배정 시 null */
  salonLatLng: { lat: number; lng: number } | null;
  /** 디자이너에 연결된 키워드 slug 목록 — 클라이언트 필터 매칭용 */
  keywordSlugs: string[];
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

/** other_links JSONB 합의 스키마 (Design DS-4) */
export type DesignerLinks = {
  message?: string;
  instagram?: string;
  whatsapp?: string;
  naver?: string;
};

/** 지도 마커용 (기존 모델 — list.ts로 이전) */
export type DesignerMapItem = {
  salonId: string;
  salonName: string;
  latitude: number;
  longitude: number;
  designerCount: number;
};
