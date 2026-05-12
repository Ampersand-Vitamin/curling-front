// designer_keyword 분포 검증 — 카테고리별 키워드 사용 빈도
import { createClient } from "@supabase/supabase-js";

async function main() {
  const c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: cats } = await c
    .from("keyword_category")
    .select("id, slug, name, display_order")
    .order("display_order");

  const TARGET = new Set([
    "hair_type",
    "treatment",
    "style",
    "languages",
    "specialty",
    "service",
  ]);

  for (const cat of cats ?? []) {
    if (!TARGET.has(cat.slug)) continue;

    const { data: kws } = await c
      .from("keyword")
      .select("id, slug, name")
      .eq("category_id", cat.id);

    console.log(`\n=== ${cat.slug} (${kws?.length ?? 0} keywords) ===`);

    const counts: Array<{ slug: string; name: string; n: number }> = [];
    for (const k of kws ?? []) {
      const { count } = await c
        .from("designer_keyword")
        .select("*", { count: "exact", head: true })
        .eq("keyword_id", k.id);
      counts.push({ slug: k.slug, name: k.name, n: count ?? 0 });
    }
    counts.sort((a, b) => b.n - a.n);
    for (const e of counts) {
      console.log(`  ${String(e.n).padStart(4)}  ${e.slug.padEnd(34)} ${e.name}`);
    }
    const ns = counts.map((c) => c.n);
    const min = Math.min(...ns);
    const max = Math.max(...ns);
    console.log(`  → min=${min}, max=${max}, spread=${max - min}`);
  }

  // 디자이너당 키워드 수 — 분포
  const { count: dkTotal } = await c
    .from("designer_keyword")
    .select("*", { count: "exact", head: true });
  console.log(`\n[total] designer_keyword rows: ${dkTotal}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
