// 런타임 query 임베딩.
// 사용자가 검색바에 입력한 자연어 → OpenAI text-embedding-3-large(1536d) 호출.
//
// 비용: 1 query ≈ 20 tokens × $0.13/1M = $0.0000026 (사실상 무시 가능)
// 지연: OpenAI API 평균 80~150ms — 검색 전체 latency 의 가장 큰 요소
//
// server-only. Server Action 에서만 호출.

import OpenAI from "openai";
import { EMBED_DIMENSIONS, EMBED_MODEL } from "./types";

let _openai: OpenAI | null = null;

function ensureServer() {
  if (typeof window !== "undefined") {
    throw new Error(
      "[portfolio-search/embed] OpenAI client is server-only.",
    );
  }
}

function getOpenAI(): OpenAI {
  ensureServer();
  if (_openai) return _openai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("[portfolio-search/embed] OPENAI_API_KEY 미설정");
  _openai = new OpenAI({ apiKey });
  return _openai;
}

/**
 * 사용자 query 를 1536차원 벡터로 임베딩.
 * 빈 문자열을 넘기면 null 반환 (호출 측에서 RPC 의 query_embedding 인자에 그대로 패스).
 */
export async function embedQuery(query: string): Promise<number[] | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const openai = getOpenAI();
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: trimmed.slice(0, 500), // 500자 cap — 검색 query 가 그 이상은 비정상
    dimensions: EMBED_DIMENSIONS,
  });
  const v = res.data[0]?.embedding;
  if (!v || v.length !== EMBED_DIMENSIONS) {
    throw new Error(`[portfolio-search/embed] unexpected dimensions: ${v?.length}`);
  }
  return v;
}
