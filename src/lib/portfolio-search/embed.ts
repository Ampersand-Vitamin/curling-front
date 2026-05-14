// 런타임 query 임베딩 — CLIP text encoder (768d).
//
// Design Ref: §3.4 — Option B. text-embedding-3-large 호출 제거, CLIP 으로 통합.
// 비용: 0 (로컬 추론). 지연: ~50ms/query (모델 로드 후).
//
// server-only. Server Action 에서만 호출.

import { embedText } from "./clip";
import { EMBED_DIMENSIONS } from "./types";

function ensureServer() {
  if (typeof window !== "undefined") {
    throw new Error("[portfolio-search/embed] CLIP client is server-only");
  }
}

/**
 * 사용자 query 를 768차원 CLIP 텍스트 벡터로 임베딩.
 * 빈 문자열을 넘기면 null 반환.
 */
export async function embedQuery(query: string): Promise<number[] | null> {
  ensureServer();
  const trimmed = query.trim();
  if (!trimmed) return null;

  const v = await embedText(trimmed);
  if (v.length !== EMBED_DIMENSIONS) {
    throw new Error(`[portfolio-search/embed] unexpected dims: ${v.length}`);
  }
  return v;
}
