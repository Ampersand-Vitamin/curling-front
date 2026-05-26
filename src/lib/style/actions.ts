// Style 탭 검색 Server Action.
// 클라이언트(StyleClient.tsx) ↔ pgvector RPC 의 단일 진입점.
//
// 자연어: searchStyle(params) — CLIP text encoder + BM25 RRF
// 사진:   searchStyleByImage(formData) — CLIP image encoder cosine

"use server";

import { createClient } from "@/lib/supabase/server";
import { searchPortfolios, searchPortfoliosByImage } from "@/lib/portfolio-search/search";
import type {
  StylePortfolioCard,
  StyleSearchParams,
  StyleSearchResult,
} from "@/types/style";
import sharp from "sharp";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

function rowsToHits(
  hits: Awaited<ReturnType<typeof searchPortfolios>>["hits"],
): StylePortfolioCard[] {
  return hits.map((h) => ({
    id: h.portfolioId,
    designerId: h.designerId,
    displayName: h.displayName,
    role: "",
    salonName: h.salonName,
    coverImageUrl: h.coverImageUrl,
    profileImageUrl: h.profileImageUrl,
    isFavorited: false,
  }));
}

export async function searchStyle(
  params: StyleSearchParams,
): Promise<StyleSearchResult> {
  // 입력 sanitize
  const q = (params.q ?? "").slice(0, 200);
  const keywordSlugs = (params.keywordSlugs ?? [])
    .filter((s) => typeof s === "string" && s.length > 0 && s.length <= 64)
    .slice(0, 20);

  const result = await searchPortfolios({
    q,
    keywordSlugs,
    limit: params.limit,
    cursor: params.cursor,
  });

  const hits = rowsToHits(result.hits);

  return {
    hits,
    // RPC 가 totalCount 를 반환하지 않으므로 현재 페이지 크기로 근사.
    totalEstimated: hits.length,
    nextCursor: result.nextCursor,
    query: result.query,
    appliedFilters: result.appliedFilters,
  };
}

// ─────────────────────────────────────────────
// Photo 검색 — File 업로드 → CLIP image → portfolio.image_embedding cosine
// Design Ref: §5 — Server Action
// ─────────────────────────────────────────────

export async function searchStyleByImage(
  formData: FormData,
): Promise<StyleSearchResult> {
  const file = formData.get("image");
  if (!(file instanceof File)) {
    throw new Error("photo: missing image");
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error(`photo: invalid size (${file.size} bytes, max ${MAX_IMAGE_BYTES})`);
  }
  if (!ALLOWED_MIMES.has(file.type)) {
    throw new Error(`photo: unsupported MIME ${file.type}`);
  }

  const keywordSlugsRaw = formData.get("keywordSlugs");
  const keywordSlugs =
    typeof keywordSlugsRaw === "string" && keywordSlugsRaw.length > 0
      ? keywordSlugsRaw
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.length <= 64)
          .slice(0, 20)
      : [];

  // sharp 로 224×224 정규화 후 CLIP 에 넘김 (불필요하게 큰 이미지로 추론 비용 안 들이게)
  const rawBuf = Buffer.from(await file.arrayBuffer());
  const normalized = await sharp(rawBuf)
    .resize(224, 224, { fit: "cover" })
    .removeAlpha()
    .jpeg({ quality: 85 })
    .toBuffer();

  const result = await searchPortfoliosByImage({
    imageBuffer: normalized,
    keywordSlugs,
  });

  const hits = rowsToHits(result.hits);

  return {
    hits,
    totalEstimated: hits.length,
    nextCursor: result.nextCursor,
    query: result.query,
    appliedFilters: result.appliedFilters,
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
