// Supabase row → Meili doc 매핑.
//
// CLI 인덱싱(`scripts/meili/index-designers.ts`) 전용. service_role 키 사용.
// ⚠️ Server Action / Server Component 에서는 절대 호출하지 말 것 (admin client 노출 위험).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MeiliDesignerDoc } from "./types";

// ─────────────────────────────────────────────────────────────
// Raw join row 형태 (supabase-js nested select 결과)
// ─────────────────────────────────────────────────────────────

type RawSalon = {
  id: string;
  name: string;
  address: string | null;
  neighborhood: string | null;
  type: string | null;
  languages: string[] | null;
} | null;

type RawKeywordJoin = {
  relation_type: "specialty" | "experience";
  keyword: {
    slug: string;
    name: string;
    category: { slug: string } | null;
  } | null;
};

export type DesignerJoinRow = {
  id: string;
  display_name: string | null;
  role: string | null;
  bio: string | null;
  highlight_message: string | null;
  years_of_exp: number | null;
  rating_avg: number | string;
  review_count: number;
  is_verified: boolean;
  languages: string[] | null;
  profile_image_url: string | null;
  portfolio_images: string[] | null;
  created_at: string;
  salon: RawSalon;
  designer_keyword: RawKeywordJoin[];
};

// ─────────────────────────────────────────────────────────────
// Admin client (service_role)
// ─────────────────────────────────────────────────────────────

export function makeSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "[meili/documents] NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 미설정.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─────────────────────────────────────────────────────────────
// Fetch
// ─────────────────────────────────────────────────────────────

const DESIGNER_SELECT = `
  id, display_name, role, bio, highlight_message, years_of_exp,
  rating_avg, review_count, is_verified, languages,
  profile_image_url, portfolio_images, created_at,
  salon:salon_id (
    id, name, address, neighborhood, type, languages
  ),
  designer_keyword (
    relation_type,
    keyword:keyword_id (
      slug, name,
      category:category_id ( slug )
    )
  )
`;

export async function fetchDesignersForIndex(
  client: SupabaseClient,
): Promise<DesignerJoinRow[]> {
  const { data, error } = await client
    .from("designer_profile")
    .select(DESIGNER_SELECT)
    .range(0, 4999); // 5000 rows 까지 한 번에. 더 커지면 페이지네이션.

  if (error) {
    throw new Error(`[fetchDesignersForIndex] ${error.message}`);
  }
  return (data ?? []) as unknown as DesignerJoinRow[];
}

// ─────────────────────────────────────────────────────────────
// Mapping
// ─────────────────────────────────────────────────────────────

function unionLanguages(
  designer: string[] | null,
  salon: string[] | null,
): string[] {
  const set = new Set<string>();
  for (const v of designer ?? []) if (v) set.add(v);
  for (const v of salon ?? []) if (v) set.add(v);
  return Array.from(set);
}

export function rowToDoc(row: DesignerJoinRow): MeiliDesignerDoc {
  const portfolio = row.portfolio_images ?? [];
  const cover = portfolio[0] ?? row.profile_image_url ?? null;

  // 카테고리별 키워드 평탄화
  const keywordSlugs: string[] = [];
  const keywordNames: string[] = [];
  const specialtySlugs: string[] = [];
  const experienceSlugs: string[] = [];
  const hairTypeSlugs: string[] = [];
  const treatmentSlugs: string[] = [];
  const amenitySlugs: string[] = [];
  const inclusivitySlugs: string[] = [];

  for (const row_kw of row.designer_keyword ?? []) {
    const kw = row_kw.keyword;
    if (!kw) continue;
    const categorySlug = kw.category?.slug;
    keywordSlugs.push(kw.slug);
    keywordNames.push(kw.name);
    if (row_kw.relation_type === "specialty") specialtySlugs.push(kw.slug);
    if (row_kw.relation_type === "experience") experienceSlugs.push(kw.slug);
    switch (categorySlug) {
      case "hair_type":
        hairTypeSlugs.push(kw.slug);
        break;
      case "treatment":
      case "service":
      case "specialty":
        treatmentSlugs.push(kw.slug);
        break;
      case "amenities":
        amenitySlugs.push(kw.slug);
        break;
      case "inclusivity":
        inclusivitySlugs.push(kw.slug);
        break;
    }
  }

  return {
    id: row.id,
    displayName: row.display_name ?? "Designer",
    role: row.role ?? "",
    bio: row.bio,
    highlightMessage: row.highlight_message,
    keywordNames,
    profileImageUrl: row.profile_image_url,
    coverImageUrl: cover,
    portfolioImages: portfolio,
    salonId: row.salon?.id ?? null,
    salonName: row.salon?.name ?? null,
    salonAddress: row.salon?.address ?? null,
    salonNeighborhood: row.salon?.neighborhood ?? null,
    salonType: row.salon?.type ?? null,
    keywordSlugs,
    specialtySlugs,
    experienceSlugs,
    hairTypeSlugs,
    treatmentSlugs,
    amenitySlugs,
    inclusivitySlugs,
    ratingAvg: Number(row.rating_avg ?? 0),
    reviewCount: row.review_count ?? 0,
    yearsOfExp: row.years_of_exp,
    isVerified: !!row.is_verified,
    createdAtTs: Math.floor(new Date(row.created_at).getTime() / 1000),
    languages: unionLanguages(row.languages, row.salon?.languages ?? null),
  };
}
