// Style 탭 검색 Server Action.
// 클라이언트(StyleClient.tsx) ↔ pgvector RPC 의 단일 진입점.
//
// 자연어: searchStyle(params) — CLIP text encoder + BM25 RRF
// 사진:   searchStyleByImage(formData) — CLIP image encoder cosine
// 키워드: extractImageKeywords(formData) — CLIP cross-modal cosine scoring

"use server";

import { createClient } from "@/lib/supabase/server";
import { searchPortfolios, searchPortfoliosByImage } from "@/lib/portfolio-search/search";
import { getRecommendedKeywords } from "@/lib/style/recommendedKeywords";
import type {
  RecommendedKeyword,
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

  // 텍스트 쿼리가 없고 키워드만 있으면, 키워드 이름을 CLIP 텍스트 쿼리로 변환하여 벡터 검색
  const effectiveQ =
    q.length === 0 && keywordSlugs.length > 0
      ? keywordSlugs
          .map((s) => s.replace(/_/g, " "))
          .join(", ")
          .slice(0, 200)
      : q;

  const result = await searchPortfolios({
    q: effectiveQ,
    keywordSlugs: [],  // slug 정확 매칭 대신 벡터 검색에 위임
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

// ─────────────────────────────────────────────
// 이미지 → 키워드 추출 — CLIP cross-modal cosine scoring
// 이미지 임베딩과 각 키워드 텍스트 임베딩 간 유사도로 순위 결정
// ─────────────────────────────────────────────

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export async function extractImageKeywords(
  formData: FormData,
): Promise<RecommendedKeyword[]> {
  const allKeywords = getRecommendedKeywords();
  const file = formData.get("image");

  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > MAX_IMAGE_BYTES ||
    !ALLOWED_MIMES.has(file.type)
  ) {
    return allKeywords;
  }

  try {
    const rawBuf = Buffer.from(await file.arrayBuffer());
    const normalized = await sharp(rawBuf)
      .resize(224, 224, { fit: "cover" })
      .removeAlpha()
      .jpeg({ quality: 85 })
      .toBuffer();

    const { embedImage, embedText } = await import("../portfolio-search/clip");
    const imageVec = await embedImage(normalized);

    // 각 키워드를 텍스트 임베딩 후 이미지와 코사인 유사도 계산 (둘 다 L2 정규화됨)
    const scored = await Promise.all(
      allKeywords.map(async (kw) => {
        const textVec = await embedText(kw.label);
        return { ...kw, score: dotProduct(imageVec, textVec) };
      }),
    );

    return scored
      .sort((a, b) => b.score - a.score)
      .map(({ slug, label }) => ({ slug, label }));
  } catch (err) {
    console.warn("[extractImageKeywords] CLIP scoring failed, returning defaults", err);
    return allKeywords;
  }
}
