// portfolio_search 의 런타임 검색 진입점.
//
// Design Ref: §3, §5 — Option B (CLIP unified). text/image 모두 같은 768d 공간.
//
// 흐름 (자연어):
//   1) query 가 비어있지 않으면 CLIP text encoder (~50ms, 모델 로드 후)
//   2) Supabase RPC 'search_portfolios' 호출 (~10-50ms, BM25 + 벡터 RRF)
//   3) raw row → PortfolioSearchHit (storageUrl 적용)
//
// 흐름 (사진):
//   1) Buffer → embedImage (CLIP image encoder, ~500ms)
//   2) RPC 의 query_image_embedding 파라미터로 분기
//   3) raw row → PortfolioSearchHit

import { storageUrl } from "@/lib/storage";
import { getPortfolioAdminClient } from "./client";
import { embedQuery } from "./embed";
import {
  RPC_NAME,
  type PortfolioRpcRow,
  type PortfolioSearchHit,
  type PortfolioSearchParams,
  type PortfolioSearchResult,
} from "./types";

const PLACEHOLDER_PORTFOLIO = "asset/placeholder/portfolio.svg";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 60;

function rowToHit(row: PortfolioRpcRow): PortfolioSearchHit {
  return {
    portfolioId: row.id,
    designerId: row.designer_id,
    coverImageUrl: row.image_path
      ? storageUrl(row.image_path)
      : storageUrl(PLACEHOLDER_PORTFOLIO),
    title: row.title,
    description: row.description,
    keywords: row.keywords ?? [],
    displayName: row.display_name ?? "Designer",
    profileImageUrl: row.profile_image_url ? storageUrl(row.profile_image_url) : null,
    salonId: row.salon_id,
    salonName: row.salon_name,
    ratingAvg: Number(row.rating_avg ?? 0),
    score: Number(row.score ?? 0),
  };
}

export async function searchPortfolios(
  params: PortfolioSearchParams,
): Promise<PortfolioSearchResult> {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(params.cursor ?? 0, 0);
  const keywordSlugs = (params.keywordSlugs ?? []).filter(
    (s) => typeof s === "string" && s.length > 0,
  );

  // (1) embedding — query 가 비어있지 않을 때만 (CLIP text encoder)
  const queryEmbedding = await embedQuery(params.q);

  // (2) RPC
  const supabase = getPortfolioAdminClient();
  const filterKeywords = keywordSlugs.length > 0 ? keywordSlugs : null;
  console.log("[searchPortfolios]", { q: params.q, filterKeywords, limit, offset });

  const { data, error } = await supabase.rpc(RPC_NAME, {
    query_text: params.q ?? "",
    query_embedding: queryEmbedding,
    filter_keywords: filterKeywords,
    result_limit: limit,
    result_offset: offset,
  });

  if (error) {
    throw new Error(`[searchPortfolios] RPC 실패: ${error.message}`);
  }

  const rows = (data ?? []) as PortfolioRpcRow[];
  console.log("[searchPortfolios] rows:", rows.length, rows.slice(0, 3).map(r => ({ id: r.id.slice(0, 8), keywords: r.keywords })));
  const hits = rows.map(rowToHit);

  // (3) 페이지네이션 — RPC 가 totalCount 를 반환하지 않으므로
  // hits.length === limit 이면 다음 페이지가 있을 가능성으로 표시.
  const nextCursor = hits.length === limit ? offset + hits.length : null;

  return {
    hits,
    nextCursor,
    query: params.q ?? "",
    appliedFilters: keywordSlugs,
  };
}

// ─────────────────────────────────────────────
// 사진 검색 — Buffer → CLIP image → image_embedding cosine
// Design Ref: §5, §3.2 (사진 우선 분기)
// ─────────────────────────────────────────────

export type PortfolioImageSearchParams = {
  /** 224x224 처리된 이미지 Buffer 가 이상적이지만, sharp 미적용 원본도 받음 (embedImage 내부에서 처리). */
  imageBuffer: Buffer;
  keywordSlugs?: string[];
  limit?: number;
  cursor?: number;
};

export async function searchPortfoliosByImage(
  params: PortfolioImageSearchParams,
): Promise<PortfolioSearchResult> {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(params.cursor ?? 0, 0);
  const keywordSlugs = (params.keywordSlugs ?? []).filter(
    (s) => typeof s === "string" && s.length > 0,
  );

  // (1) CLIP image embedding (768d)
  const { embedImage } = await import("./clip");
  const queryImageEmbedding = await embedImage(params.imageBuffer);

  // (2) RPC — query_text 빈, query_embedding null, query_image_embedding 채움
  const supabase = getPortfolioAdminClient();
  const { data, error } = await supabase.rpc(RPC_NAME, {
    query_text: "",
    query_embedding: null,
    filter_keywords: keywordSlugs.length > 0 ? keywordSlugs : null,
    result_limit: limit,
    result_offset: offset,
    query_image_embedding: queryImageEmbedding,
  });

  if (error) {
    throw new Error(`[searchPortfoliosByImage] RPC 실패: ${error.message}`);
  }

  const rows = (data ?? []) as PortfolioRpcRow[];
  const hits = rows.map(rowToHit);
  const nextCursor = hits.length === limit ? offset + hits.length : null;

  return {
    hits,
    nextCursor,
    query: "(image)",
    appliedFilters: keywordSlugs,
  };
}
