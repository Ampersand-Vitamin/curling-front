// Sync keyword 테이블을 filter spec v3 에 맞춤
//   - 안전 삭제 (참조 0): hindi, amenity_*, tax_free, inclusivity_* dup, pregnancy_safe
//   - 매핑 포함 삭제: by_appointment(2), walk_in_welcome(2)
//   - english_speaking(40)는 데이터 보존 위해 유지 (사용자 결정)
//   - 이름 정합화: chinese, pet_friendly, wheelchair_access, private_room, foreigner_friendly
import { createClient } from "@supabase/supabase-js";

const DELETE_SAFE = [
  "hindi",
  "amenity_pet_friendly",
  "amenity_wheelchair",
  "amenity_private_rooms",
  "tax_free",
  "inclusivity_foreigner_friendly",
  "inclusivity_vegan",
  "pregnancy_safe",
];
const DELETE_WITH_REFS = ["by_appointment", "walk_in_welcome"];

const RENAMES: Array<{ slug: string; name: string }> = [
  { slug: "chinese", name: "Chinese (Mandarin)" },
  { slug: "pet_friendly", name: "Pet-friendly" },
  { slug: "wheelchair_access", name: "Wheelchair Accessible" },
  { slug: "private_room", name: "Private Rooms" },
  { slug: "foreigner_friendly", name: "Foreigner-friendly" },
];

async function main() {
  const c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const allSlugs = [...DELETE_SAFE, ...DELETE_WITH_REFS];
  const { data: targets, error: e1 } = await c
    .from("keyword")
    .select("id, slug")
    .in("slug", allSlugs);
  if (e1) throw e1;

  const idBySlug = new Map<string, string>();
  for (const t of targets ?? []) idBySlug.set(t.slug, t.id);
  console.log(`[fetch] resolved ${idBySlug.size}/${allSlugs.length} target keywords`);

  // 1) 참조가 있는 키워드의 매핑 먼저 정리
  for (const slug of DELETE_WITH_REFS) {
    const id = idBySlug.get(slug);
    if (!id) {
      console.log(`[skip] ${slug} not in DB`);
      continue;
    }
    const { error: e2, count } = await c
      .from("salon_keyword")
      .delete({ count: "exact" })
      .eq("keyword_id", id);
    if (e2) throw e2;
    console.log(`[unlink] salon_keyword for ${slug}: ${count ?? 0} rows`);
  }

  // 2) 키워드 삭제
  const idsToDelete = allSlugs
    .map((s) => idBySlug.get(s))
    .filter((x): x is string => Boolean(x));
  if (idsToDelete.length) {
    const { error: e3, count } = await c
      .from("keyword")
      .delete({ count: "exact" })
      .in("id", idsToDelete);
    if (e3) throw e3;
    console.log(`[delete] keywords removed: ${count ?? 0}`);
  }

  // 3) 이름 정합화
  for (const r of RENAMES) {
    const { error: e4, count } = await c
      .from("keyword")
      .update({ name: r.name }, { count: "exact" })
      .eq("slug", r.slug);
    if (e4) throw e4;
    console.log(`[rename] ${r.slug} -> "${r.name}" (${count ?? 0} rows)`);
  }

  console.log("\n[done] keyword spec sync complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
