// 검색 RPC sanity test — 자연어(CLIP text) + 키워드 필터.
// Module-5 회귀 게이트: B 채택 검증.
//
// 기존(OpenAI text-embedding-3-large) 결과 (2026-05-15 시점, 직전 PDCA TIL 기록):
//   "long blonde balayage"           → top 1: portfolio/balayage/09.jpg (Long Wavy Hair with Balayage Highlights)
//   "tight curly afro cut for men"   → top 1: portfolio/afro_cut/01.jpg (Short Tapered Afro Cut)
//   "platinum blonde highlights"     → top 1: portfolio/highlights/03.jpg (Warm Blonde Highlights on Loose Waves)
//   "box braids on long hair"        → top 1: portfolio/braids/09.jpg (Long Box Braids with Defined Parting)
//
// B 채택 허용 기준:
//   - top 1 이 같은 keyword slug 의 portfolio 인 경우: PASS (slug 매칭은 의미 정합)
//   - top 5 안에 의미적으로 무관한 결과가 다수면 FAIL → BM25 가중치 ↑ 또는 rollback

import { createClient } from "@supabase/supabase-js";
import { embedText } from "../../src/lib/portfolio-search/clip";

const NL_QUERIES = [
  "long blonde balayage",
  "tight curly afro cut for men",
  "platinum blonde highlights",
  "box braids on long hair",
];

const KW_FILTERS: string[][] = [
  ["balayage"],
  ["afro_cut"],
  ["highlights"],
];

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log("════════ KEYWORD FILTER MODE ════════");
  for (const kws of KW_FILTERS) {
    const { data, error } = await supabase.rpc("search_portfolios", {
      query_text: "",
      query_embedding: null,
      filter_keywords: kws,
      result_limit: 3,
    });
    console.log(`\n── filter: [${kws.join(", ")}]`);
    if (error) {
      console.error("  ERR:", error.message);
      continue;
    }
    for (const r of data as Array<{ title: string; keywords: string[]; image_path: string; score: number }>) {
      console.log(`  [${r.score?.toFixed?.(2) ?? r.score}] ${r.title}`);
      console.log(`         kws: ${r.keywords.join(", ")}`);
      console.log(`         img: ${r.image_path}`);
    }
  }

  console.log("\n\n════════ NL QUERY (BM25 + CLIP text RRF) MODE ════════");
  for (const q of NL_QUERIES) {
    const queryEmbedding = await embedText(q);
    const { data, error } = await supabase.rpc("search_portfolios", {
      query_text: q,
      query_embedding: queryEmbedding,
      filter_keywords: null,
      result_limit: 5,
    });
    console.log(`\n── "${q}"`);
    if (error) {
      console.error("  ERR:", error.message);
      continue;
    }
    for (const r of data as Array<{ title: string; keywords: string[]; image_path: string; score: number }>) {
      console.log(`  [${r.score?.toFixed?.(4) ?? r.score}] ${r.title}`);
      console.log(`         kws: ${r.keywords.join(", ")}`);
      console.log(`         img: ${r.image_path}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
