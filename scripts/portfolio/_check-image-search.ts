// 사진 검색 sanity test.
//
// 검증 시나리오:
//   1) Self-similarity — 같은 이미지를 query 로 주면 top 1 == 자기 자신
//   2) Cluster similarity — query 가 X 키워드 portfolio 이면 top 5 에 같은 X 키워드 portfolio 가 ≥ 3개

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { embedImage } from "../../src/lib/portfolio-search/clip";

type Hit = {
  image_path: string;
  title: string;
  keywords: string[];
  score: number;
};

const SCENARIOS = [
  { slug: "balayage",   sample: "tmp/portfolio-images/balayage/01.jpg" },
  { slug: "afro_cut",   sample: "tmp/portfolio-images/afro_cut/01.jpg" },
  { slug: "highlights", sample: "tmp/portfolio-images/highlights/01.jpg" },
  { slug: "braids",     sample: "tmp/portfolio-images/braids/01.jpg" },
  { slug: "locs",       sample: "tmp/portfolio-images/locs/01.jpg" },
];

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log("════════ IMAGE SEARCH SANITY ════════\n");

  for (const sc of SCENARIOS) {
    const buf = await readFile(sc.sample);
    const queryEmb = await embedImage(buf);

    const { data, error } = await supabase.rpc("search_portfolios", {
      query_text: "",
      query_embedding: null,
      filter_keywords: null,
      result_limit: 5,
      query_image_embedding: queryEmb,
    });
    if (error) {
      console.error(`  ERR: ${error.message}`);
      continue;
    }

    const hits = (data ?? []) as Hit[];
    const expectedSlug = sc.slug;
    const expectedImagePath = `portfolio/${sc.sample.replace("tmp/portfolio-images/", "")}`;
    const top1IsSelf = hits[0]?.image_path === expectedImagePath;
    const sameSlugInTop5 = hits.filter((h) => h.keywords.includes(expectedSlug)).length;

    console.log(`── query: ${sc.sample}`);
    console.log(`   expected slug: ${expectedSlug}`);
    console.log(`   self in top 1? ${top1IsSelf ? "✓ PASS" : "✗ FAIL (top 1 = " + (hits[0]?.image_path ?? "(none)") + ")"}`);
    console.log(`   same-slug in top 5: ${sameSlugInTop5}/5 ${sameSlugInTop5 >= 3 ? "✓ PASS" : "⚠ low"}`);
    for (const h of hits.slice(0, 5)) {
      const marker = h.image_path === expectedImagePath ? "★" : h.keywords.includes(expectedSlug) ? "✓" : " ";
      console.log(`     [${h.score.toFixed(3)}] ${marker} ${h.image_path} — ${h.title}`);
    }
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
