// keyword_category.name 을 spec v3 표기에 맞춤
import { createClient } from "@supabase/supabase-js";

const RENAMES: Array<{ slug: string; name: string }> = [
  { slug: "languages", name: "Language" },
  { slug: "inclusivity", name: "Inclusivity & Values" },
];

async function main() {
  const c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  for (const r of RENAMES) {
    const { error, count } = await c
      .from("keyword_category")
      .update({ name: r.name }, { count: "exact" })
      .eq("slug", r.slug);
    if (error) throw error;
    console.log(`[rename] ${r.slug} -> "${r.name}" (${count ?? 0} rows)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
