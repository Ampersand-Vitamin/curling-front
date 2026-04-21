// Design Ref: §3.1 — DB keyword 테이블과 FilterPopup 섹션 타입 정의

export type Keyword = {
  id: string;
  name: string;
  slug: string;
  group_name: string | null;
  display_order: number;
};

export type KeywordGroup = {
  group_name: string;
  keywords: Keyword[];
};

export type FilterCategorySlug =
  | "languages"
  | "hair_type"
  | "treatment"
  | "special_offers";

export type FilterSection = {
  slug: FilterCategorySlug;
  displayName: string;
  keywords?: Keyword[];
  groups?: KeywordGroup[];
};

// Plan FR-05: FilterPopup에 렌더할 4개 카테고리의 표시 순서
export const FILTER_SECTION_ORDER: readonly FilterCategorySlug[] = [
  "languages",
  "hair_type",
  "treatment",
  "special_offers",
] as const;

// Plan FR-05: slug → UI 표시명 매핑
export const FILTER_SECTION_DISPLAY_NAME: Record<FilterCategorySlug, string> = {
  languages: "Language",
  hair_type: "Hair Type",
  treatment: "Service",
  special_offers: "Salon Features",
};
