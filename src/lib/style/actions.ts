"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  StylePortfolioCard,
  StyleSearchParams,
  StyleSearchResult,
} from "@/types/style";

export async function searchStyle(
  params: StyleSearchParams,
): Promise<StyleSearchResult> {
  const supabase = await createClient();
  const q = (params.q ?? "").toLowerCase().trim();
  const limit = params.limit ?? 30;
  const offset = params.cursor ?? 0;

  // 1. 포트폴리오 목록
  const { data: portfolios, error: pErr } = await supabase
    .from("designer_portfolio")
    .select("id, designer_id, image_url, sort_order")
    .order("designer_id")
    .order("sort_order")
    .range(offset, offset + limit - 1);

  if (pErr) {
    console.warn("[searchStyle] portfolio query failed", pErr.message);
    return { hits: [], totalEstimated: 0, nextCursor: null, query: q, appliedFilters: [] };
  }

  const rows = portfolios ?? [];
  if (rows.length === 0) {
    return { hits: [], totalEstimated: 0, nextCursor: null, query: q, appliedFilters: [] };
  }

  // 2. 디자이너 프로필
  const designerIds = [...new Set(rows.map((r) => r.designer_id as string))];
  const { data: profiles } = await supabase
    .from("onboarding_profiles")
    .select("user_id, name, salon_name, avatar_url, specialty")
    .in("user_id", designerIds.map((id) => id.toString()));

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  // 3. 현재 유저의 즐겨찾기 포트폴리오 ID 목록
  const { data: { user } } = await supabase.auth.getUser();
  let favoritedIds = new Set<string>();
  if (user) {
    const { data: favs } = await supabase
      .from("favorite_portfolio")
      .select("portfolio_id")
      .eq("user_id", user.id);
    favoritedIds = new Set((favs ?? []).map((f) => f.portfolio_id as string));
  }

  // 4. 합치기 + 필터
  let hits: StylePortfolioCard[] = rows.map((r) => {
    const profile = profileMap.get(r.designer_id as string);
    return {
      id: r.id as string,
      designerId: r.designer_id as string,
      displayName: profile?.name ?? "Designer",
      role: "",
      salonName: profile?.salon_name ?? null,
      coverImageUrl: r.image_url as string,
      profileImageUrl: profile?.avatar_url ?? null,
      isFavorited: favoritedIds.has(r.id as string),
    };
  });

  if (q) {
    hits = hits.filter((h) => {
      const name = h.displayName.toLowerCase();
      const salon = (h.salonName ?? "").toLowerCase();
      const profile = profileMap.get(h.designerId);
      const keywords = ((profile?.specialty as string[]) ?? []).map((s) => s.toLowerCase());
      return name.includes(q) || salon.includes(q) || keywords.some((k) => k.includes(q));
    });
  }

  return {
    hits,
    totalEstimated: hits.length,
    nextCursor: rows.length === limit ? offset + limit : null,
    query: q,
    appliedFilters: [],
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

// 사진 검색은 pgvector 없이 미지원
export async function searchStyleByImage(): Promise<StyleSearchResult> {
  return { hits: [], totalEstimated: 0, nextCursor: null, query: "(image)", appliedFilters: [] };
}
