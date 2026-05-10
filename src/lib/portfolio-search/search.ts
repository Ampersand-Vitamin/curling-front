// portfolio_search 의 런타임 검색 진입점.
//
// 흐름:
//   1) query 가 비어있지 않으면 OpenAI 임베딩 1회 호출 (~80-150ms)
//   2) Supabase RPC 'search_portfolios' 호출 (~10-50ms, hybrid RRF 또는 rating fallback)
//   3) raw row → PortfolioSearchHit (storageUrl 적용)
//
// 입력 sanitize 는 호출 측(actions.ts)에서 이미 처리한다고 가정하지만 limit/offset 만 한 번 더 가드.

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

  // (1) embedding — query 가 비어있지 않을 때만
  const queryEmbedding = await embedQuery(params.q);

  // (2) RPC
  const supabase = getPortfolioAdminClient();
  const { data, error } = await supabase.rpc(RPC_NAME, {
    query_text: params.q ?? "",
    query_embedding: queryEmbedding,
    filter_keywords: keywordSlugs.length > 0 ? keywordSlugs : null,
    result_limit: limit,
    result_offset: offset,
  });

  if (error) {
    throw new Error(`[searchPortfolios] RPC 실패: ${error.message}`);
  }

  const rows = (data ?? []) as PortfolioRpcRow[];
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
