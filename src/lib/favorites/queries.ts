"use server";

import { createClient } from "@/lib/supabase/server";
import type { FavoriteDesigner, FavoritePortfolio } from "./types";

type RawDesignerRow = {
  id: string;
  display_name: string;
  profile_image_url: string | null;
  salon: { name: string } | null;
};

type RawKeywordRow = {
  designer_id: string;
  relation_type: string;
  keyword: {
    slug: string;
    name: string;
    category: { slug: string } | null;
  } | null;
};

type RawPortfolioImageRow = {
  designer_id: string;
  image_path: string;
};

type RawPortfolioRow = {
  id: string;
  image_path: string;
  designer: {
    display_name: string;
    profile_image_url: string | null;
    salon: { name: string } | null;
  } | null;
};

export async function getFavoriteDesigners(): Promise<FavoriteDesigner[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // 1) Get favorite designer IDs
  const { data: favRows, error: favError } = await supabase
    .from("favorite")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("target_type", "designer")
    .order("created_at", { ascending: false });

  if (favError || !favRows?.length) return [];

  const designerIds = favRows.map((r) => r.target_id as string);

  // 2) Fetch designer profiles, keywords, portfolio images in parallel
  const [profileRes, keywordRes, portfolioRes] = await Promise.all([
    supabase
      .from("designer_profile")
      .select(
        `id, display_name, profile_image_url,
         salon:salon_id ( name )`,
      )
      .in("id", designerIds),
    supabase
      .from("designer_keyword")
      .select(
        `designer_id, relation_type,
         keyword:keyword_id (
           slug, name,
           category:category_id ( slug )
         )`,
      )
      .in("designer_id", designerIds),
    supabase
      .from("portfolio")
      .select("designer_id, image_path")
      .in("designer_id", designerIds)
      .order("display_order", { ascending: true }),
  ]);

  if (profileRes.error) return [];

  const profiles = (profileRes.data ?? []) as unknown as RawDesignerRow[];
  const kwRows = (keywordRes.data ?? []) as unknown as RawKeywordRow[];
  const pRows = (portfolioRes.data ?? []) as unknown as RawPortfolioImageRow[];

  // Group keywords and portfolio images by designer
  const kwMap = new Map<
    string,
    { slug: string; name: string; categorySlug: string }[]
  >();
  for (const r of kwRows) {
    if (!r.keyword?.category) continue;
    const list = kwMap.get(r.designer_id) ?? [];
    list.push({
      slug: r.keyword.slug,
      name: r.keyword.name,
      categorySlug: r.keyword.category.slug,
    });
    kwMap.set(r.designer_id, list);
  }

  const imgMap = new Map<string, string[]>();
  for (const r of pRows) {
    const list = imgMap.get(r.designer_id) ?? [];
    if (list.length < 4) list.push(r.image_path);
    imgMap.set(r.designer_id, list);
  }

  // Build result in favorite order
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  return designerIds
    .map((id) => {
      const p = profileMap.get(id);
      if (!p) return null;
      return {
        id: p.id,
        displayName: p.display_name,
        profileImageUrl: p.profile_image_url,
        salonName: p.salon?.name ?? null,
        keywords: kwMap.get(p.id) ?? [],
        portfolioImages: imgMap.get(p.id) ?? [],
      };
    })
    .filter((x): x is FavoriteDesigner => x !== null);
}

export async function getFavoritePortfolios(): Promise<FavoritePortfolio[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: favRows, error: favError } = await supabase
    .from("favorite")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("target_type", "portfolio")
    .order("created_at", { ascending: false });

  if (favError || !favRows?.length) return [];

  const portfolioIds = favRows.map((r) => r.target_id as string);

  const { data, error } = await supabase
    .from("portfolio")
    .select(
      `id, image_path,
       designer:designer_id (
         display_name, profile_image_url,
         salon:salon_id ( name )
       )`,
    )
    .in("id", portfolioIds);

  if (error || !data) return [];

  const rows = data as unknown as RawPortfolioRow[];
  const rowMap = new Map(rows.map((r) => [r.id, r]));

  return portfolioIds
    .map((id) => {
      const r = rowMap.get(id);
      if (!r) return null;
      return {
        id: r.id,
        imagePath: r.image_path,
        designerName: r.designer?.display_name ?? "",
        designerProfileImageUrl: r.designer?.profile_image_url ?? null,
        salonName: r.designer?.salon?.name ?? null,
      };
    })
    .filter((x): x is FavoritePortfolio => x !== null);
}
