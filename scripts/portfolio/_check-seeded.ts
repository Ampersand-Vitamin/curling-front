import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data, error } = await supabase
    .from("portfolio")
    .select("id, image_path, title, description, keywords, embedding")
    .limit(10);
  if (error) {
    console.error(error.message);
    return;
  }
  for (const r of data ?? []) {
    const emb = r.embedding as unknown as number[] | string | null;
    const dims = Array.isArray(emb) ? emb.length : (typeof emb === "string" ? "string(needs parse)" : "null");
    console.log(`\n── ${r.image_path}`);
    console.log(`  title: ${r.title}`);
    console.log(`  desc:  ${r.description}`);
    console.log(`  kws:   ${(r.keywords as string[]).join(", ")}`);
    console.log(`  embedding: ${dims} dims`);
  }
}
main();
