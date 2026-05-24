// Design Ref: §3.2, §4.2 — designer-detail
// Plan FR-02
//
// 단건 디자이너 상세 조회. supabase-js chain 2단계로 분리:
//   (1) designer_profile + salon (nested select)
//   (2) designer_keyword + keyword + keyword_category
//   (3) portfolio rows
// → Promise.all 로 병렬 실행 후 도메인 모델로 변환.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
import type {
  DesignerDetail,
  DesignerKeyword,
  DesignerLinks,
} from "./types";

// snake_case Raw 타입 — 외부 노출 X
type RawSalon = { id: string; name: string; address: string | null } | null;

type RawDesigner = {
  id: string;
  display_name: string;
  role: string;
  bio: string | null;
  highlight_message: string | null;
  years_of_exp: number | null;
  rating_avg: number | string;
  review_count: number;
  is_verified: boolean;
  languages: string[];
  other_links: Record<string, unknown> | null;
  profile_image_url: string | null;
  salon: RawSalon;
};

type RawKeywordRow = {
  relation_type: "specialty" | "experience";
  keyword: {
    slug: string;
    name: string;
    category: { slug: string } | null;
  } | null;
};

type RawPortfolioRow = {
  image_path: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Design DS-10: invalid UUID도 null 반환 → page.tsx 에서 notFound() */
export async function getDesignerById(id: string): Promise<DesignerDetail | null> {
  if (!UUID_RE.test(id)) return null;

  const [profileRes, keywordRes, portfolioRes] = await Promise.all([
    supabase
      .from("designer_profile")
      .select(
        `id, display_name, role, bio, highlight_message, years_of_exp,
         rating_avg, review_count, is_verified, languages, other_links,
         profile_image_url,
         salon:salon_id ( id, name, address )`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("designer_keyword")
      .select(
        `relation_type,
         keyword:keyword_id (
           slug, name,
           category:category_id ( slug )
         )`,
      )
      .eq("designer_id", id),
    supabase
      .from("portfolio")
      .select("image_path")
      .eq("designer_id", id)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (profileRes.error || keywordRes.error || portfolioRes.error || !profileRes.data) {
    if (profileRes.error) {
      console.warn("[getDesignerById] profile error", profileRes.error.message);
    }
    if (keywordRes.error) {
      console.warn("[getDesignerById] keyword error", keywordRes.error.message);
    }
    if (portfolioRes.error) {
      console.warn("[getDesignerById] portfolio error", portfolioRes.error.message);
    }
    return null;
  }

  return toDomain(
    profileRes.data as unknown as RawDesigner,
    (keywordRes.data ?? []) as unknown as RawKeywordRow[],
    (portfolioRes.data ?? []) as unknown as RawPortfolioRow[],
  );
}

function toDomain(
  raw: RawDesigner,
  kwRows: RawKeywordRow[],
  portfolioRows: RawPortfolioRow[],
): DesignerDetail {
  const keywords: DesignerKeyword[] = kwRows
    .filter((r) => r.keyword && r.keyword.category)
    .map((r) => ({
      slug: r.keyword!.slug,
      name: r.keyword!.name,
      categorySlug: r.keyword!.category!.slug,
      relationType: r.relation_type,
    }));

  return {
    id: raw.id,
    displayName: raw.display_name,
    role: raw.role,
    bio: raw.bio,
    highlightMessage: raw.highlight_message,
    yearsOfExp: raw.years_of_exp,
    ratingAvg: Number(raw.rating_avg),
    reviewCount: raw.review_count,
    isVerified: raw.is_verified,
    languages: raw.languages ?? [],
    otherLinks: (raw.other_links ?? {}) as DesignerLinks,
    profileImageUrl: raw.profile_image_url,
    portfolioImages: portfolioRows.map((r) => r.image_path),
    salon: raw.salon
      ? { id: raw.salon.id, name: raw.salon.name, address: raw.salon.address }
      : null,
    keywords,
  };
}
