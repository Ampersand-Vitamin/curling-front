// salon_keyword 시드 — amenities + inclusivity 두 카테고리를 살롱들에게 골고루(균형) + 랜덤하게 매핑.
//
// 사용:
//   pnpm tsx --env-file=.env scripts/keywords/seed-salon-keywords.ts          # 추가 upsert
//   pnpm tsx --env-file=.env scripts/keywords/seed-salon-keywords.ts --reset  # 전부 삭제 후 재시드
//
// 매핑 대상 카테고리 (살롱 단위 속성):
//   amenities      (e.g. Free Parking, Wi-Fi, ...)
//   inclusivity    (e.g. Foreigner-friendly, Vegan Products, ...)
//
// 디자이너 시드와 동일한 greedy balanced 알고리즘 — 모든 keyword 사용 횟수 편차 ≤ 1.
// salon_keyword 의 PK 는 (salon_id, keyword_id) — relation_type 없음.

import { createClient } from "@supabase/supabase-js";

const RESET = process.argv.includes("--reset");

const TARGET_CATEGORY_SLUGS = new Set(["amenities", "inclusivity"]);

// 카테고리별 살롱당 픽 수
const PICKS_BY_CATEGORY: Record<string, number> = {
  amenities: 3, // 11 → 살롱당 3개 (≈ 키워드당 14살롱)
  inclusivity: 2, // 7 → 살롱당 2개 (≈ 키워드당 14살롱)
};

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 균형 + 랜덤 할당.
 *   - 각 살롱에게 picksPerSalon 개 키워드 부여
 *   - 누적 사용 수가 적은 키워드를 우선 (동률 시 랜덤)
 *   → 모든 키워드의 사용 횟수 편차 ≤ 1
 */
function balancedAssign(
  salonIds: string[],
  keywordIds: string[],
  picksPerSalon: number,
): Array<{ salon_id: string; keyword_id: string }> {
  const K = keywordIds.length;
  const P = Math.min(picksPerSalon, K);
  if (P === 0) return [];

  const countByKeyword = new Map<string, number>(keywordIds.map((k) => [k, 0]));
  const result: Array<{ salon_id: string; keyword_id: string }> = [];

  for (const s of shuffle([...salonIds])) {
    const sorted = shuffle([...keywordIds]).sort(
      (a, b) => (countByKeyword.get(a) ?? 0) - (countByKeyword.get(b) ?? 0),
    );
    const picks = sorted.slice(0, P);
    for (const k of picks) {
      result.push({ salon_id: s, keyword_id: k });
      countByKeyword.set(k, (countByKeyword.get(k) ?? 0) + 1);
    }
  }
  return result;
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1) 살롱 fetch
  const { data: salons, error: e1 } = await supabase.from("salon").select("id");
  if (e1) throw e1;
  const salonIds = (salons ?? []).map((s) => s.id as string);
  console.log(`[fetch] salons: ${salonIds.length}`);
  if (salonIds.length === 0) {
    console.log("[abort] no salons");
    return;
  }

  // 2) 카테고리 fetch
  const { data: cats, error: e2 } = await supabase
    .from("keyword_category")
    .select("id, slug, name, display_order")
    .order("display_order");
  if (e2) throw e2;

  const targetCategories = (cats ?? []).filter((c) =>
    TARGET_CATEGORY_SLUGS.has(c.slug),
  );
  console.log(
    `[fetch] target categories: ${targetCategories.map((c) => c.slug).join(", ")}`,
  );

  // 3) reset
  if (RESET) {
    console.log("\n[reset] deleting all salon_keyword rows...");
    const { error: eDel, count } = await supabase
      .from("salon_keyword")
      .delete({ count: "exact" })
      .neq("salon_id", "00000000-0000-0000-0000-000000000000"); // delete all
    if (eDel) throw eDel;
    console.log(`[reset] removed: ${count ?? 0} rows`);
  }

  // 4) 카테고리별 키워드 fetch → 균형 할당
  const rowsToInsert: Array<{ salon_id: string; keyword_id: string }> = [];

  for (const cat of targetCategories) {
    const { data: kws, error: eK } = await supabase
      .from("keyword")
      .select("id, slug")
      .eq("category_id", cat.id);
    if (eK) throw eK;
    const keywordIds = (kws ?? []).map((k) => k.id as string);
    if (keywordIds.length === 0) {
      console.log(`  [${cat.slug.padEnd(15)}] (0 keywords) skip`);
      continue;
    }
    const picks = PICKS_BY_CATEGORY[cat.slug] ?? 2;
    const assignments = balancedAssign(salonIds, keywordIds, picks);
    console.log(
      `  [${cat.slug.padEnd(15)}] keywords=${keywordIds.length.toString().padStart(2)}` +
        `  picks/salon=${Math.min(picks, keywordIds.length)}` +
        `  → ${assignments.length} rows`,
    );
    rowsToInsert.push(...assignments);
  }

  console.log(`\n[insert] total rows to upsert: ${rowsToInsert.length}`);

  // 5) 배치 upsert — composite PK 기준 중복 무시
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rowsToInsert.length; i += CHUNK) {
    const chunk = rowsToInsert.slice(i, i + CHUNK);
    const { error: eU, count } = await supabase
      .from("salon_keyword")
      .upsert(chunk, {
        onConflict: "salon_id,keyword_id",
        ignoreDuplicates: true,
        count: "exact",
      });
    if (eU) throw eU;
    inserted += count ?? chunk.length;
    process.stdout.write(
      `\r[upsert] ${Math.min(i + CHUNK, rowsToInsert.length)}/${rowsToInsert.length}`,
    );
  }
  process.stdout.write("\n");
  console.log(`[done] upserted: ${inserted}`);

  // 6) 사후 검증 — 카테고리별 + 키워드별 빈도
  console.log("\n[verify] per-keyword counts:");
  for (const cat of targetCategories) {
    const { data: kws } = await supabase
      .from("keyword")
      .select("id, slug, name")
      .eq("category_id", cat.id);
    console.log(`\n  === ${cat.slug} ===`);
    const counts: Array<{ slug: string; n: number }> = [];
    for (const k of kws ?? []) {
      const { count } = await supabase
        .from("salon_keyword")
        .select("*", { count: "exact", head: true })
        .eq("keyword_id", k.id);
      counts.push({ slug: k.slug, n: count ?? 0 });
    }
    counts.sort((a, b) => b.n - a.n);
    for (const e of counts) {
      console.log(`    ${String(e.n).padStart(3)}  ${e.slug}`);
    }
    const ns = counts.map((c) => c.n);
    console.log(
      `    → min=${Math.min(...ns)}, max=${Math.max(...ns)}, spread=${Math.max(...ns) - Math.min(...ns)}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
