// Meilisearch designers 인덱스 도큐먼트 타입.
// schema.ts 의 settings 와 1:1 대응. 변경 시 reindex 필요할 수 있음.

export const DESIGNERS_INDEX = "designers" as const;
export const PRIMARY_KEY = "id" as const;
export const EMBEDDER_NAME = "openai_3_large" as const;

/** Supabase row → Meili doc 매핑 결과. */
export type MeiliDesignerDoc = {
  // 식별
  id: string;
  displayName: string;
  role: string;

  // 검색 텍스트
  bio: string | null;
  highlightMessage: string | null;
  /** 모든 카테고리의 keyword.name 합본 (영문 표기 — 검색 가중) */
  keywordNames: string[];

  // 카드 렌더 (raw storage path — UI 에서 storageUrl 적용)
  profileImageUrl: string | null;
  /** portfolio_images[0] ?? profile_image_url */
  coverImageUrl: string | null;
  portfolioImages: string[];

  // 살롱
  salonId: string | null;
  salonName: string | null;
  salonAddress: string | null;
  salonNeighborhood: string | null;
  salonType: string | null;

  // 키워드 (필터)
  keywordSlugs: string[];
  specialtySlugs: string[];
  experienceSlugs: string[];
  hairTypeSlugs: string[];
  treatmentSlugs: string[];
  amenitySlugs: string[];
  inclusivitySlugs: string[];

  // 정렬/필터
  ratingAvg: number;
  reviewCount: number;
  yearsOfExp: number | null;
  isVerified: boolean;
  createdAtTs: number;
  languages: string[];
};

/** Meilisearch search hit — 운영 측에서 retrieve 하는 attributes 만 정확히 옵션으로. */
export type MeiliSearchHit = Pick<
  MeiliDesignerDoc,
  | "id"
  | "displayName"
  | "role"
  | "highlightMessage"
  | "salonId"
  | "salonName"
  | "profileImageUrl"
  | "coverImageUrl"
  | "keywordNames"
  | "languages"
>;
