// getBestMatchDesigners 결과 검증 — keywordSlugs 가 실제 채워지는지 확인
import { createClient } from "@supabase/supabase-js";

async function main() {
  const c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await c
    .from("designer_profile")
    .select(`
      id, display_name, role, profile_image_url, portfolio_images,
      languages, highlight_message, salon_id,
      designer_keyword ( keyword:keyword_id ( slug ) )
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("error:", error);
    return;
  }

  console.log(`fetched: ${data?.length ?? 0} designers (top 10 by created_at DESC)\n`);

  type Row = {
    id: string;
    display_name: string;
    designer_keyword:
      | { keyword: { slug: string } | null }[]
      | null;
  };

  const slugCount: Record<string, number> = {};

  for (const d of (data as unknown as Row[]) ?? []) {
    const slugs = (d.designer_keyword ?? [])
      .map((r) => r.keyword?.slug)
      .filter((s): s is string => Boolean(s));
    console.log(`${d.display_name.padEnd(20)} [${slugs.length}] ${slugs.join(", ")}`);
    for (const s of slugs) slugCount[s] = (slugCount[s] ?? 0) + 1;
  }

  console.log("\n=== slug 빈도 (top 10 designer 한정) ===");
  Object.entries(slugCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([s, n]) => console.log(`  ${String(n).padStart(2)}  ${s}`));

  console.log(`\n총 unique slugs in top 10: ${Object.keys(slugCount).length}`);
  console.log(`총 keyword 매핑: ${Object.values(slugCount).reduce((a, b) => a + b, 0)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
