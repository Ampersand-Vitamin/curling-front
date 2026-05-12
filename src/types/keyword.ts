// Design Ref: §3.1 — DB keyword 테이블과 FilterPopup 섹션 타입 정의

export type Keyword = {
  id: string;
  name: string;
  slug: string;
  group_name: string | null;
  display_order: number;
  /** 1: 기본 노출, 2: "More" 안에 숨김 (filter spec v3) */
  tier: 1 | 2;
};

export type KeywordGroup = {
  group_name: string;
  keywords: Keyword[];
};

export type FilterCategorySlug =
  | "languages"
  | "specialty"
  | "service"
  | "amenities"
  | "inclusivity";

export type FilterSection = {
  slug: FilterCategorySlug;
  displayName: string;
  keywords?: Keyword[];
  groups?: KeywordGroup[];
};

// FilterPopup 표시 순서 — filter spec v3 (Language / Specialty / Service / Amenities / Inclusivity)
// price_range, location 은 칩 외의 UI(슬라이더/지도)라 keyword 테이블에 없음
export const FILTER_SECTION_ORDER: readonly FilterCategorySlug[] = [
  "languages",
  "specialty",
  "service",
  "amenities",
  "inclusivity",
] as const;

// slug → UI 표시명 매핑
export const FILTER_SECTION_DISPLAY_NAME: Record<FilterCategorySlug, string> = {
  languages: "Language",
  specialty: "Specialty",
  service: "Service",
  amenities: "Amenities",
  inclusivity: "Inclusivity & Values",
};
