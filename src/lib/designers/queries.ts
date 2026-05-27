import { createClient } from "@supabase/supabase-js";
import { storageUrl } from "@/lib/storage";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
import type { DesignerDetail, DesignerKeyword, DesignerLinks } from "./types";

type RawDesignerProfile = {
  id: string;
  display_name: string;
  role: string;
  profile_image_url: string | null;
  bio: string | null;
  highlight_message: string | null;
  years_of_exp: number | null;
  rating_avg: number;
  review_count: number;
  is_verified: boolean;
  languages: string[];
  other_links: Record<string, string>;
  salon: { id: string; name: string; address: string | null } | null;
  designer_keyword: { keyword: { slug: string; name: string; category_slug: string | null } | null }[] | null;
};

type RawPortfolioRow = {
  id: string;
  image_path: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getDesignerById(id: string): Promise<DesignerDetail | null> {
  if (!UUID_RE.test(id)) return null;

  const [profileRes, portfolioRes] = await Promise.all([
    supabase
      .from("designer_profile")
      .select(`
        id, display_name, role, profile_image_url,
        bio, highlight_message, years_of_exp,
        rating_avg, review_count, is_verified,
        languages, other_links,
        salon:salon_id ( id, name, address ),
        designer_keyword ( keyword:keyword_id ( slug, name, category_slug ) )
      `)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("portfolio")
      .select("id, image_path")
      .eq("designer_id", id)
      .order("display_order", { ascending: true }),
  ]);

  if (profileRes.error || !profileRes.data) {
    if (profileRes.error) {
      console.warn("[getDesignerById] profile error", profileRes.error.message);
    }
    return null;
  }

  if (portfolioRes.error) {
    console.warn("[getDesignerById] portfolio error", portfolioRes.error.message);
  }

  return toDomain(
    profileRes.data as unknown as RawDesignerProfile,
    (portfolioRes.data ?? []) as unknown as RawPortfolioRow[],
  );
}

function toDomain(raw: RawDesignerProfile, portfolioRows: RawPortfolioRow[]): DesignerDetail {
  const keywords: DesignerKeyword[] = (raw.designer_keyword ?? [])
    .filter((dk) => dk.keyword !== null)
    .map((dk) => ({
      slug: dk.keyword!.slug,
      name: dk.keyword!.name,
      categorySlug: dk.keyword!.category_slug ?? "specialty",
      relationType: "specialty" as const,
    }));

  const portfolioImages = portfolioRows.map((r) => storageUrl(r.image_path));

  return {
    id: raw.id,
    displayName: raw.display_name ?? "Designer",
    role: raw.role ?? "",
    bio: raw.bio,
    highlightMessage: raw.highlight_message,
    yearsOfExp: raw.years_of_exp,
    ratingAvg: Number(raw.rating_avg ?? 0),
    reviewCount: raw.review_count ?? 0,
    isVerified: raw.is_verified ?? false,
    languages: raw.languages ?? [],
    otherLinks: (raw.other_links ?? {}) as DesignerLinks,
    profileImageUrl: raw.profile_image_url ? storageUrl(raw.profile_image_url) : null,
    portfolioImages,
    portfolioItems: portfolioRows.map((r) => ({ id: r.id, imageUrl: storageUrl(r.image_path) })),
    salon: raw.salon ? { id: raw.salon.id, name: raw.salon.name, address: raw.salon.address } : null,
    keywords,
  };
}
