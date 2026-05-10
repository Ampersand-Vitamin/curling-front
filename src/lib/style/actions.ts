// Style 탭 검색 Server Action.
// 클라이언트(StyleClient.tsx) ↔ Meilisearch 의 단일 진입점.

"use server";

import { searchDesigners } from "@/lib/meili/search";
import type {
  StyleSearchParams,
  StyleSearchResult,
} from "@/types/style";

export async function searchStyle(
  params: StyleSearchParams,
): Promise<StyleSearchResult> {
  // 입력 sanitize — UI 가 무한 길이 query 를 보내지 않도록 1차 방어
  const q = (params.q ?? "").slice(0, 200);
  const keywordSlugs = (params.keywordSlugs ?? [])
    .filter((s) => typeof s === "string" && s.length > 0 && s.length <= 64)
    .slice(0, 20);

  return await searchDesigners({
    q,
    keywordSlugs,
    limit: params.limit,
    cursor: params.cursor,
    semanticRatio: params.semanticRatio,
  });
}
