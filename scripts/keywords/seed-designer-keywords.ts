// designer_keyword 시드 — 카테고리별로 키워드를 디자이너들에게 골고루(균형) + 랜덤하게 매핑.
//
// 사용:
//   pnpm tsx --env-file=.env scripts/keywords/seed-designer-keywords.ts          # 기존 row 유지 + 추가 (upsert)
//   pnpm tsx --env-file=.env scripts/keywords/seed-designer-keywords.ts --reset  # 기존 row 전부 삭제 후 재시드
//
// 제외 카테고리: amenities, inclusivity (살롱 특징)
//
// 균형 알고리즘:
//   각 디자이너에게 P개 키워드를 할당할 때,
//   현재 누적 할당 수가 가장 적은 키워드들을 우선 선택 (동률은 셔플로 랜덤).
//   → 모든 키워드의 사용 횟수 차이가 최대 1.
//
// relation_type:
//   - specialty 카테고리 → 'specialty'
//   - 그 외 → 'experience'

import { createClient } from "@supabase/supabase-js";

const RESET = process.argv.includes("--reset");

const EXCLUDE_CATEGORY_SLUGS = new Set(["amenities", "inclusivity"]);

// 카테고리별 디자이너당 픽 수 (실제로는 카테고리 크기로 캡)
const PICKS_BY_CATEGORY: Record<string, number> = {
  hair_type: 3,
  treatment: 3,
  style: 1,
  languages: 2,
  specialty: 2,
  service: 4,
  // 빈 카테고리(hair_concern, hair_color, hair_length, treatment_history)는 자동 skip
};

const DEFAULT_PICKS = 2;

type RelationType = "specialty" | "experience";

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 균형 + 랜덤 할당.
 *   - 각 디자이너에게 picksPerDesigner 개 키워드 부여
 *   - 누적 사용 수가 적은 키워드를 우선 (동률 시 랜덤)
 *   → 모든 키워드의 사용 횟수 편차 ≤ 1
 */
function balancedAssign(
  designerIds: string[],
  keywordIds: string[],
  picksPerDesigner: number,
): Array<{ designer_id: string; keyword_id: string }> {
  const K = keywordIds.length;
  const P = Math.min(picksPerDesigner, K);
  if (P === 0) return [];

  const countByKeyword = new Map<string, number>(keywordIds.map((k) => [k, 0]));
  const result: Array<{ designer_id: string; keyword_id: string }> = [];

  for (const d of shuffle([...designerIds])) {
    // 1) 사용 횟수 오름차순, 동률 내 랜덤 정렬
    const sorted = shuffle([...keywordIds]).sort(
      (a, b) => (countByKeyword.get(a) ?? 0) - (countByKeyword.get(b) ?? 0),
    );
    const picks = sorted.slice(0, P);
    for (const k of picks) {
      result.push({ designer_id: d, keyword_id: k });
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

  // 1) 디자이너 fetch
  const { data: designers, error: e1 } = await supabase
    .from("designer_profile")
    .select("id");
  if (e1) throw e1;
  const designerIds = (designers ?? []).map((d) => d.id as string);
  console.log(`[fetch] designers: ${designerIds.length}`);

  if (designerIds.length === 0) {
    console.log("[abort] no designers");
    return;
  }

  // 2) 카테고리 + 키워드 fetch
  const { data: cats, error: e2 } = await supabase
    .from("keyword_category")
    .select("id, slug, name, display_order")
    .order("display_order");
  if (e2) throw e2;

  const targetCategories = (cats ?? []).filter(
    (c) => !EXCLUDE_CATEGORY_SLUGS.has(c.slug),
  );
  console.log(
    `[fetch] target categories: ${targetCategories.map((c) => c.slug).join(", ")}`,
  );
  console.log(
    `[fetch] excluded: ${[...EXCLUDE_CATEGORY_SLUGS].join(", ")}`,
  );

  // 3) (옵션) reset
  if (RESET) {
    console.log("\n[reset] deleting all designer_keyword rows...");
    const { error: eDel, count } = await supabase
      .from("designer_keyword")
      .delete({ count: "exact" })
      .neq("designer_id", "00000000-0000-0000-0000-000000000000"); // delete all
    if (eDel) throw eDel;
    console.log(`[reset] removed: ${count ?? 0} rows`);
  }

  // 4) 각 카테고리별로 키워드 fetch → 균형 할당
  const rowsToInsert: Array<{
    designer_id: string;
    keyword_id: string;
    relation_type: RelationType;
  }> = [];

  for (const cat of targetCategories) {
    const { data: kws, error: eK } = await supabase
      .from("keyword")
      .select("id, slug")
      .eq("category_id", cat.id);
    if (eK) throw eK;
    const keywordIds = (kws ?? []).map((k) => k.id as string);

    if (keywordIds.length === 0) {
      console.log(`  [${cat.slug.padEnd(20)}] (0 keywords) skip`);
      continue;
    }

    const picks = PICKS_BY_CATEGORY[cat.slug] ?? DEFAULT_PICKS;
    const relationType: RelationType =
      cat.slug === "specialty" ? "specialty" : "experience";
    const assignments = balancedAssign(designerIds, keywordIds, picks);

    console.log(
      `  [${cat.slug.padEnd(20)}] keywords=${keywordIds.length.toString().padStart(2)}` +
        `  picks/designer=${Math.min(picks, keywordIds.length)}` +
        `  → ${assignments.length} rows  (relation=${relationType})`,
    );

    for (const a of assignments) {
      rowsToInsert.push({
        designer_id: a.designer_id,
        keyword_id: a.keyword_id,
        relation_type: relationType,
      });
    }
  }

  console.log(`\n[insert] total rows to upsert: ${rowsToInsert.length}`);

  // 5) 배치 upsert — composite PK에 의해 중복 무시
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rowsToInsert.length; i += CHUNK) {
    const chunk = rowsToInsert.slice(i, i + CHUNK);
    const { error: eU, count } = await supabase
      .from("designer_keyword")
      .upsert(chunk, {
        onConflict: "designer_id,keyword_id,relation_type",
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

  // 6) 사후 검증 — 카테고리별 카운트
  console.log("\n[verify] designer_keyword counts per category:");
  for (const cat of targetCategories) {
    const { data: kws } = await supabase
      .from("keyword")
      .select("id")
      .eq("category_id", cat.id);
    const ids = (kws ?? []).map((k) => k.id as string);
    if (ids.length === 0) continue;
    const { count } = await supabase
      .from("designer_keyword")
      .select("*", { count: "exact", head: true })
      .in("keyword_id", ids);
    console.log(`  ${cat.slug.padEnd(20)} → ${count ?? 0}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
