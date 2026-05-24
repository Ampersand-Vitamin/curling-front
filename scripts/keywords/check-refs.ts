// Check salon_keyword / designer_keyword references for candidates we may remove
import { createClient } from "@supabase/supabase-js";

const CANDIDATES = [
  // amenities — duplicates / out-of-spec
  "amenity_pet_friendly",
  "amenity_wheelchair",
  "amenity_private_rooms",
  "english_speaking",
  "by_appointment",
  "walk_in_welcome",
  "tax_free",
  // inclusivity — duplicates / out-of-spec
  "inclusivity_foreigner_friendly",
  "inclusivity_vegan",
  "pregnancy_safe",
  // languages — out-of-spec
  "hindi",
];

async function main() {
  const c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: kws, error } = await c
    .from("keyword")
    .select("id, slug, name")
    .in("slug", CANDIDATES);
  if (error) throw error;

  console.log("=== ref counts ===");
  for (const k of kws ?? []) {
    const { count: salonCount } = await c
      .from("salon_keyword")
      .select("*", { count: "exact", head: true })
      .eq("keyword_id", k.id);
    const { count: designerCount } = await c
      .from("designer_keyword")
      .select("*", { count: "exact", head: true })
      .eq("keyword_id", k.id);
    console.log(
      `  ${k.slug.padEnd(35)} salon=${salonCount ?? 0}  designer=${designerCount ?? 0}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
