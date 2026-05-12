import { createClient } from "@supabase/supabase-js";

async function main() {
  const c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { count: salonCount } = await c
    .from("salon")
    .select("*", { count: "exact", head: true });
  console.log("salons:", salonCount);

  const { count: skCount } = await c
    .from("salon_keyword")
    .select("*", { count: "exact", head: true });
  console.log("salon_keyword rows:", skCount);

  // category 별 매핑 카운트
  const { data: cats } = await c
    .from("keyword_category")
    .select("id, slug")
    .order("display_order");
  console.log("\n[salon_keyword by category]:");
  for (const cat of cats ?? []) {
    const { data: kws } = await c
      .from("keyword")
      .select("id")
      .eq("category_id", cat.id);
    const ids = (kws ?? []).map((k) => k.id);
    if (ids.length === 0) continue;
    const { count } = await c
      .from("salon_keyword")
      .select("*", { count: "exact", head: true })
      .in("keyword_id", ids);
    console.log(`  ${cat.slug.padEnd(20)} → ${count ?? 0}`);
  }

  // 살롱별 매핑 수 (분포)
  const { data: byS } = await c.from("salon_keyword").select("salon_id");
  const dist: Record<string, number> = {};
  for (const r of byS ?? []) dist[r.salon_id] = (dist[r.salon_id] ?? 0) + 1;
  const counts = Object.values(dist);
  if (counts.length > 0) {
    console.log(`\n[per-salon] avg=${(counts.reduce((a, b) => a + b) / counts.length).toFixed(1)} min=${Math.min(...counts)} max=${Math.max(...counts)} (salons with keywords: ${counts.length})`);
  }
}

main().catch(console.error);
