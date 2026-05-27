"use server";

import { createClient } from "@/lib/supabase/server";
import { storageUrl } from "@/lib/storage";

export interface PortfolioDetailData {
  id: string;
  imageUrl: string;
  designerId: string;
  designerName: string;
  salonName: string | null;
  avatarUrl: string | null;
  isFavorited: boolean;
  otherPortfolios: {
    id: string;
    imageUrl: string;
    isFavorited: boolean;
  }[];
}

export async function getPortfolioDetail(portfolioId: string): Promise<PortfolioDetailData | null> {
  const supabase = await createClient();

  const { data: portfolio, error } = await supabase
    .from("portfolio")
    .select("id, designer_id, image_path")
    .eq("id", portfolioId)
    .maybeSingle();

  if (error || !portfolio) return null;

  const [profileRes, otherRes, authRes] = await Promise.all([
    supabase
      .from("designer_profile")
      .select("display_name, profile_image_url, salon:salon_id ( name )")
      .eq("id", portfolio.designer_id)
      .maybeSingle(),
    supabase
      .from("portfolio")
      .select("id, image_path")
      .eq("designer_id", portfolio.designer_id)
      .neq("id", portfolioId)
      .order("display_order", { ascending: true })
      .limit(10),
    supabase.auth.getUser(),
  ]);

  const profile = profileRes.data;
  const others = otherRes.data ?? [];
  const user = authRes.data?.user;

  let favoritedIds = new Set<string>();
  if (user) {
    const allIds = [portfolioId, ...others.map((o) => o.id)];
    const { data: favs } = await supabase
      .from("favorite_portfolio")
      .select("portfolio_id")
      .eq("user_id", user.id)
      .in("portfolio_id", allIds);
    favoritedIds = new Set((favs ?? []).map((f) => f.portfolio_id as string));
  }

  const salonRaw = profile?.salon as unknown;
  const salon = Array.isArray(salonRaw) ? salonRaw[0] as { name: string } | undefined : salonRaw as { name: string } | null;

  return {
    id: portfolio.id as string,
    imageUrl: storageUrl(portfolio.image_path as string),
    designerId: portfolio.designer_id as string,
    designerName: profile?.display_name ?? "Designer",
    salonName: salon?.name ?? null,
    avatarUrl: profile?.profile_image_url ? storageUrl(profile.profile_image_url as string) : null,
    isFavorited: favoritedIds.has(portfolioId),
    otherPortfolios: others.map((o) => ({
      id: o.id as string,
      imageUrl: storageUrl(o.image_path as string),
      isFavorited: favoritedIds.has(o.id as string),
    })),
  };
}

export async function toggleFavoritePortfolio(portfolioId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("favorite_portfolio")
    .select("portfolio_id")
    .eq("user_id", user.id)
    .eq("portfolio_id", portfolioId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorite_portfolio")
      .delete()
      .eq("user_id", user.id)
      .eq("portfolio_id", portfolioId);
    return false;
  } else {
    await supabase.from("favorite_portfolio")
      .insert({ user_id: user.id, portfolio_id: portfolioId });
    return true;
  }
}
