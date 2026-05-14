import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // tables
  const tables = ["salon", "keyword_category", "keyword", "designer_profile", "designer_keyword", "salon_keyword", "portfolio"];
  for (const t of tables) {
    const { error, count } = await supabase.from(t).select("*", { count: "exact", head: true });
    console.log(`${t.padEnd(25)} ${error ? "MISSING (" + error.message + ")" : count + " rows"}`);
  }

  // portfolio embedding NULL counts
  const { count: nullText } = await supabase.from("portfolio").select("*", { count: "exact", head: true }).is("embedding", null);
  const { count: nullImg } = await supabase.from("portfolio").select("*", { count: "exact", head: true }).is("image_embedding", null);
  console.log(`\nNULL embedding:        ${nullText}`);
  console.log(`NULL image_embedding:  ${nullImg}`);

  // designer_profile temp columns 존재 여부
  const { data: dp, error: dpErr } = await supabase.from("designer_profile").select("id, _temp_specialties").limit(1);
  if (dpErr) {
    console.log(`\n_temp_specialties:     ${dpErr.message.includes("column") ? "DROPPED ✓" : dpErr.message}`);
  } else {
    console.log(`\n_temp_specialties:     STILL EXISTS (${(dp?.[0] as Record<string, unknown> | undefined)?._temp_specialties === undefined ? "but accessible" : "with data"})`);
  }
}

main();
