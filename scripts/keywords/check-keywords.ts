// One-shot diff: 현재 DB의 카테고리별 keyword 목록 출력
import { createClient } from "@supabase/supabase-js";

const SPEC_CATEGORIES = [
  "languages",
  "specialty",
  "service",
  "amenities",
  "inclusivity",
];

async function main() {
  const c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: cats, error: e1 } = await c
    .from("keyword_category")
    .select("id, slug, name, display_order")
    .order("display_order");
  if (e1) throw e1;

  console.log("=== keyword_category ===");
  cats?.forEach((c) =>
    console.log(`  ${c.display_order.toString().padStart(3)}  ${c.slug.padEnd(20)} ${c.name}`),
  );

  for (const slug of SPEC_CATEGORIES) {
    const cat = cats?.find((c) => c.slug === slug);
    if (!cat) {
      console.log(`\n[!] category not found: ${slug}`);
      continue;
    }
    const { data: kws, error: e2 } = await c
      .from("keyword")
      .select("id, name, slug, group_name, display_order")
      .eq("category_id", cat.id)
      .order("display_order");
    if (e2) throw e2;

    console.log(`\n=== ${slug} (${kws?.length ?? 0}) ===`);
    kws?.forEach((k) =>
      console.log(
        `  ${(k.display_order ?? 0).toString().padStart(4)}  ${(k.group_name ?? "-").padEnd(20)}  ${k.slug.padEnd(32)}  ${k.name}`,
      ),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
