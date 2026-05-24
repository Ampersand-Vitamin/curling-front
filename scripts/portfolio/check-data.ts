// 빠른 데이터 점검 — portfolio_images 가 실제로 있는지.
import { createClient } from "@supabase/supabase-js";

async function main() {
  const c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { count: total } = await c
    .from("designer_profile")
    .select("*", { count: "exact", head: true });

  const { data: sample } = await c
    .from("designer_profile")
    .select("id, display_name, portfolio_images")
    .limit(5);

  console.log("=== 통계 ===");
  console.log("총 디자이너:", total);

  console.log("\n=== 샘플 5건 ===");
  sample?.forEach((d) => {
    const n = d.portfolio_images?.length ?? 0;
    console.log(
      `  ${d.display_name?.padEnd(15)} images=${n}  sample=${d.portfolio_images?.[0] ?? "(none)"}`,
    );
  });

  const distinct = new Set<number>();
  const { data: all } = await c
    .from("designer_profile")
    .select("portfolio_images");
  all?.forEach((d) =>
    distinct.add(Array.isArray(d.portfolio_images) ? d.portfolio_images.length : 0),
  );
  console.log("\nimages 개수 분포:", [...distinct].sort((a, b) => a - b));

  const { count: withImages } = await c
    .from("designer_profile")
    .select("*", { count: "exact", head: true })
    .gt("array_length(portfolio_images, 1)", 0);
  console.log("portfolio_images 가 1개 이상인 디자이너:", withImages);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
