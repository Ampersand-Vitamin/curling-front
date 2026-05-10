// Meilisearch 검색 wrapper — Server Action(`src/lib/style/actions.ts`)에서만 호출.
//
// 결과의 coverImageUrl 은 raw storage path 를 받아서 storageUrl() 적용까지 해서 반환.
// → UI 컴포넌트는 그대로 <img src=> 가능.

import { storageUrl } from "@/lib/storage";
import { getMeiliSearchClient } from "./client";
import {
  DESIGNERS_INDEX,
  EMBEDDER_NAME,
  type MeiliSearchHit,
} from "./types";
import type {
  StylePortfolioCard,
  StyleSearchParams,
  StyleSearchResult,
} from "@/types/style";

const PLACEHOLDER_PORTFOLIO = "asset/placeholder/portfolio.svg";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 60;

const RETRIEVE_ATTRS = [
  "id",
  "displayName",
  "role",
  "highlightMessage",
  "salonId",
  "salonName",
  "profileImageUrl",
  "coverImageUrl",
  "keywordNames",
  "languages",
] as const;

function escape(value: string): string {
  // Meilisearch filter 의 문자열 quoting — 큰따옴표 escape.
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildFilter(slugs: string[] | undefined): string | undefined {
  if (!slugs || slugs.length === 0) return undefined;
  const inner = slugs.map((s) => `"${escape(s)}"`).join(", ");
  return `keywordSlugs IN [${inner}]`;
}

function toCard(hit: MeiliSearchHit): StylePortfolioCard {
  const cover = hit.coverImageUrl
    ? storageUrl(hit.coverImageUrl)
    : storageUrl(PLACEHOLDER_PORTFOLIO);
  const profile = hit.profileImageUrl ? storageUrl(hit.profileImageUrl) : null;
  return {
    id: hit.id,
    displayName: hit.displayName,
    role: hit.role,
    salonName: hit.salonName,
    coverImageUrl: cover,
    profileImageUrl: profile,
    isFavorited: false,
  };
}

export async function searchDesigners(
  params: StyleSearchParams,
): Promise<StyleSearchResult> {
  const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = params.cursor ?? 0;
  const filter = buildFilter(params.keywordSlugs);
  const isEmpty = !params.q && (!params.keywordSlugs || params.keywordSlugs.length === 0);
  // 빈 검색 + 빈 필터 → 평점순 정렬 (디자인의 초기 그리드)
  const ratio = isEmpty ? 0 : params.semanticRatio ?? 0.5;

  const client = getMeiliSearchClient();
  const res = await client.index(DESIGNERS_INDEX).search<MeiliSearchHit>(
    params.q,
    {
      limit,
      offset,
      filter,
      hybrid: { embedder: EMBEDDER_NAME, semanticRatio: ratio },
      attributesToRetrieve: [...RETRIEVE_ATTRS],
      sort: isEmpty ? ["ratingAvg:desc", "reviewCount:desc"] : undefined,
    },
  );

  const hits = res.hits.map(toCard);
  const totalEstimated = res.estimatedTotalHits ?? hits.length;
  const nextCursor =
    offset + hits.length < totalEstimated ? offset + hits.length : null;

  return {
    hits,
    totalEstimated,
    nextCursor,
    query: params.q,
    appliedFilters: params.keywordSlugs ?? [],
  };
}
