import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
import type { DesignerDetail, DesignerKeyword, DesignerLinks } from "./types";

type RawProfile = {
  user_id: string;
  name: string | null;
  salon_name: string | null;
  avatar_url: string | null;
  title: string | null;
  bio: string | null;
  career_years: number | null;
  specialty: string[] | null;
  languages: string[] | null;
};

type RawPortfolioRow = {
  id: string;
  image_url: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getDesignerById(id: string): Promise<DesignerDetail | null> {
  if (!UUID_RE.test(id)) return null;

  const [profileRes, portfolioRes] = await Promise.all([
    supabase
      .from("onboarding_profiles")
      .select("user_id, name, salon_name, avatar_url, title, bio, career_years, specialty, languages")
      .eq("user_id", id)
      .maybeSingle(),
    supabase
      .from("designer_portfolio")
      .select("id, image_url")
      .eq("designer_id", id)
      .order("sort_order", { ascending: true }),
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
    profileRes.data as unknown as RawProfile,
    (portfolioRes.data ?? []) as unknown as RawPortfolioRow[],
  );
}

function toDomain(raw: RawProfile, portfolioRows: RawPortfolioRow[]): DesignerDetail {
  const keywords: DesignerKeyword[] = (raw.specialty ?? []).map((s) => ({
    slug: s.toLowerCase().replace(/\s+/g, "-"),
    name: s,
    categorySlug: "specialty",
    relationType: "specialty" as const,
  }));

  return {
    id: raw.user_id,
    displayName: raw.name ?? "Designer",
    role: raw.title ?? "",
    bio: raw.bio,
    highlightMessage: null,
    yearsOfExp: raw.career_years,
    ratingAvg: 0,
    reviewCount: 0,
    isVerified: false,
    languages: raw.languages ?? [],
    otherLinks: {} as DesignerLinks,
    profileImageUrl: raw.avatar_url,
    portfolioImages: portfolioRows.map((r) => r.image_url),
    portfolioItems: portfolioRows.map((r) => ({ id: r.id, imageUrl: r.image_url })),
    salon: raw.salon_name ? { id: "", name: raw.salon_name, address: null } : null,
    keywords,
  };
}
