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
  | "amenities"
  | "inclusivity";

export type FilterSection = {
  slug: FilterCategorySlug;
  displayName: string;
  keywords?: Keyword[];
  groups?: KeywordGroup[];
};

// Plan FR-05: FilterPopup에 렌더할 카테고리의 표시 순서
// special_offers는 amenities + inclusivity로 분리됨 (seed 31_keywords_v2.sql)
export const FILTER_SECTION_ORDER: readonly FilterCategorySlug[] = [
  "hair_type",
  "treatment",
  "languages",
  "amenities",
  "inclusivity",
] as const;

// Plan FR-05: slug → UI 표시명 매핑
export const FILTER_SECTION_DISPLAY_NAME: Record<FilterCategorySlug, string> = {
  languages: "Language",
  hair_type: "Hair Type",
  treatment: "Service",
  amenities: "Amenities",
  inclusivity: "Inclusivity",
};
