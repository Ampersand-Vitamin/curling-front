// Stage 3 — Storage 에 있는 이미지를 portfolio 테이블에 시드 (메타데이터만)
//
// 흐름:
//   1) tmp/portfolio-images/_index.json 로드 (slug, photos[]: file, alt, photographer)
//   2) Supabase: designer_profile + designer_keyword + keyword 마스터 fetch
//   3) 각 이미지를 designer 들에게 round-robin 분배
//   4) (designer_id, image_path) 이미 존재하면 skip (idempotent)
//   5) gpt-4o-mini Vision 으로 title/description/keywords 생성
//   6) 100 row 씩 INSERT (search_doc 은 trigger 가 자동 생성)
//
// ⚠ image_embedding(CLIP) 은 본 스크립트가 채우지 않는다.
//   INSERT 후 별도로 `pnpm portfolio:embed-clip` 실행.
//
// 사용:
//   pnpm portfolio:seed-kw                # idempotent
//   pnpm portfolio:seed-kw -- --reset     # 기존 portfolio 전체 삭제 후 재생성
//   pnpm portfolio:seed-kw -- --limit=20  # 처음 20 job 만 (smoke)
//   pnpm portfolio:seed-kw -- --dry       # LLM/INSERT 없이 분배만 미리보기

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const STORAGE_BUCKET = "portfolio";
const SOURCE_REL = "tmp/portfolio-images";
const INDEX_FILE = "_index.json";

const MAX_DESCRIPTION_LEN = 200;
const CHUNK = 100;

// ─────────────────────────────────────────────────────────────
// Args
// ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    reset: args.includes("--reset"),
    dry: args.includes("--dry"),
    limit: (() => {
      const a = args.find((x) => x.startsWith("--limit="));
      return a ? Number(a.slice("--limit=".length)) : undefined;
    })(),
  };
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type IndexPhoto = {
  file: string;
  photo_id?: string;
  unsplash_id?: string;
  photographer: string;
  photographer_url: string;
  alt: string | null;
  source_url?: string;
};

type IndexEntry = {
  slug: string;
  category: string;
  query: string;
  provider?: string;
  photos: IndexPhoto[];
};

type IndexFile = { entries: IndexEntry[] };

type DesignerRow = {
  id: string;
  display_name: string | null;
  role: string | null;
  bio: string | null;
  highlight_message: string | null;
  years_of_exp: number | null;
  languages: string[] | null;
  salon: { name: string; neighborhood: string | null } | null;
  designer_keyword: Array<{
    relation_type: "specialty" | "experience";
    keyword: { slug: string; name: string } | null;
  }>;
};

type KeywordRow = { slug: string; name: string };

type Job = {
  designer: DesignerRow;
  keywordSlug: string;
  keywordName: string;
  imagePath: string; // portfolio/<slug>/<n>.jpg
  alt: string | null;
  fileIndex: number; // for display_order 보조
};

type SeedRow = {
  designer_id: string;
  image_path: string;
  title: string;
  description: string;
  keywords: string[];
  display_order: number;
};

// ─────────────────────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────────────────────

function makeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("[seed] Supabase env missing");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─────────────────────────────────────────────────────────────
// Fetch helpers
// ─────────────────────────────────────────────────────────────

async function fetchDesigners(supabase: SupabaseClient): Promise<DesignerRow[]> {
  const { data, error } = await supabase
    .from("designer_profile")
    .select(
      `
      id, display_name, role, bio, highlight_message, years_of_exp, languages,
      salon:salon_id ( name, neighborhood ),
      designer_keyword (
        relation_type,
        keyword:keyword_id ( slug, name )
      )
      `,
    )
    .range(0, 4999);
  if (error) throw new Error(`[seed/designers] ${error.message}`);
  return (data ?? []) as unknown as DesignerRow[];
}

async function fetchKeywordMaster(supabase: SupabaseClient): Promise<Map<string, KeywordRow>> {
  const { data, error } = await supabase.from("keyword").select("slug, name").range(0, 4999);
  if (error) throw new Error(`[seed/keywords] ${error.message}`);
  const map = new Map<string, KeywordRow>();
  for (const r of data ?? []) map.set(r.slug as string, r as KeywordRow);
  return map;
}

async function fetchExisting(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase.from("portfolio").select("designer_id, image_path");
  if (error) throw new Error(`[seed/existing] ${error.message}`);
  return new Set((data ?? []).map((r) => `${r.designer_id}::${r.image_path}`));
}

// ─────────────────────────────────────────────────────────────
// Simple meta (LLM 없이 slug + alt + 디자이너 keyword 기반)
// ─────────────────────────────────────────────────────────────

function slugToTitle(slug: string): string {
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function generateMeta(job: Job): {
  title: string;
  description: string;
  keywords: string[];
} {
  const prettyName = slugToTitle(job.keywordSlug);
  const designerName = job.designer.display_name ?? "Stylist";

  // title: alt 텍스트가 있으면 활용, 없으면 keyword + designer 조합
  const title = job.alt
    ? job.alt.slice(0, 80)
    : `${prettyName} by ${designerName}`;

  // description: keyword name + designer 컨텍스트
  const specialties = job.designer.designer_keyword
    .filter((k) => k.relation_type === "specialty" && k.keyword)
    .map((k) => k.keyword!.name);
  const desc = specialties.length > 0
    ? `${prettyName} — ${designerName} specializing in ${specialties.slice(0, 3).join(", ")}`
    : `${prettyName} — portfolio by ${designerName}`;

  // keywords: primary slug + 디자이너의 specialty/experience slugs
  const designerSlugs = job.designer.designer_keyword
    .map((k) => k.keyword?.slug)
    .filter((s): s is string => !!s);
  const keywords = Array.from(new Set([job.keywordSlug, ...designerSlugs])).slice(0, 8);

  return { title, description: desc.slice(0, MAX_DESCRIPTION_LEN), keywords };
}



// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  const args = parseArgs();
  const supabase = makeClient();

  // 1) Index 로드
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const indexPath = join(__dirname, "../..", SOURCE_REL, INDEX_FILE);
  const indexRaw = await readFile(indexPath, "utf-8").catch(() => {
    throw new Error(`[seed] index not found: ${indexPath} — run pnpm portfolio:fetch first`);
  });
  const index = JSON.parse(indexRaw) as IndexFile;
  console.log(`[seed] index entries: ${index.entries.length}`);

  // 2) Designers + keyword master
  console.log("[seed] fetching designers ...");
  const designers = await fetchDesigners(supabase);
  console.log(`[seed] ${designers.length} designers`);

  console.log("[seed] fetching keyword master ...");
  const keywordMap = await fetchKeywordMaster(supabase);
  console.log(`[seed] ${keywordMap.size} keywords`);

  // 3) Reset (optional)
  if (args.reset) {
    console.log("[seed] --reset: deleting all portfolio rows ...");
    const { error } = await supabase.from("portfolio").delete().not("id", "is", null);
    if (error) throw new Error(`[seed/reset] ${error.message}`);
    console.log("[seed] reset done");
  }

  // 4) Existing skip set
  const existing = args.reset ? new Set<string>() : await fetchExisting(supabase);
  console.log(`[seed] existing rows: ${existing.size}`);

  // 5) 분배 — keyword 매칭 우선, fallback round-robin
  //    디자이너의 designer_keyword (specialty/experience) 에 해당 slug 이 있으면 우선 배정.
  //    매칭 디자이너가 없으면 전체 디자이너 중 round-robin fallback.

  // keyword slug → 해당 keyword 를 specialty/experience 로 가진 디자이너 목록
  const designersByKeyword = new Map<string, DesignerRow[]>();
  for (const d of designers) {
    for (const dk of d.designer_keyword) {
      const slug = dk.keyword?.slug;
      if (!slug) continue;
      if (!designersByKeyword.has(slug)) designersByKeyword.set(slug, []);
      designersByKeyword.get(slug)!.push(d);
    }
  }

  // keyword slug 별 round-robin cursor
  const keywordCursors = new Map<string, number>();
  let globalCursor = 0;

  const jobs: Job[] = [];
  for (const entry of index.entries) {
    const keywordRow = keywordMap.get(entry.slug);
    const keywordName = keywordRow?.name ?? entry.slug;

    const matched = designersByKeyword.get(entry.slug) ?? [];
    if (!keywordCursors.has(entry.slug)) keywordCursors.set(entry.slug, 0);

    for (let i = 0; i < entry.photos.length; i++) {
      const photo = entry.photos[i];

      let designer: DesignerRow;
      if (matched.length > 0) {
        // specialty/experience 매칭 디자이너 round-robin
        const cur = keywordCursors.get(entry.slug)!;
        designer = matched[cur % matched.length];
        keywordCursors.set(entry.slug, cur + 1);
      } else {
        // fallback: 전체 디자이너 round-robin
        designer = designers[globalCursor % designers.length];
        globalCursor++;
      }

      const imagePath = `${STORAGE_BUCKET}/${entry.slug}/${photo.file}`;
      const key = `${designer.id}::${imagePath}`;
      if (existing.has(key)) continue;
      jobs.push({
        designer,
        keywordSlug: entry.slug,
        keywordName,
        imagePath,
        alt: photo.alt,
        fileIndex: i,
      });
    }
  }

  // 매칭 통계 로그
  const matchedCount = jobs.filter((j) => {
    const matched = designersByKeyword.get(j.keywordSlug) ?? [];
    return matched.some((d) => d.id === j.designer.id);
  }).length;
  console.log(
    `[seed] keyword-matched: ${matchedCount}/${jobs.length} (${jobs.length ? Math.round((matchedCount / jobs.length) * 100) : 0}%)`,
  );
  console.log(`[seed] ${jobs.length} new jobs (after skip)`);

  if (args.limit) {
    jobs.splice(args.limit);
    console.log(`[seed] limit applied → ${jobs.length} jobs`);
  }

  if (args.dry) {
    console.log("\n─── Dry run preview (first 10) ───");
    for (const j of jobs.slice(0, 10)) {
      console.log(`  ${j.keywordSlug} → ${j.designer.display_name ?? j.designer.id.slice(0, 8)} | ${j.imagePath}`);
    }
    console.log(`\n총 jobs: ${jobs.length} — exiting (--dry)`);
    return;
  }

  if (jobs.length === 0) {
    console.log("[seed] nothing to do");
    return;
  }

  // 6) 메타데이터 생성 (slug + alt + 디자이너 keyword 기반, LLM 불필요)
  const rows: SeedRow[] = [];

  for (const job of jobs) {
    const meta = generateMeta(job);
    rows.push({
      designer_id: job.designer.id,
      image_path: job.imagePath,
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      display_order: job.fileIndex,
    });
  }

  console.log(`[seed] generated: ${rows.length} rows`);

  // 7) INSERT
  console.log(`[seed] inserting ${rows.length} rows ...`);
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from("portfolio").insert(chunk);
    if (error) {
      console.error(`[seed/insert] chunk ${i / CHUNK + 1} failed:`, error.message);
      throw error;
    }
    console.log(`[seed] inserted ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }

  const { count } = await supabase.from("portfolio").select("*", { count: "exact", head: true });
  console.log(`[seed] done. portfolio total rows: ${count}`);
  console.log(`[seed] elapsed: ${Math.round((Date.now() - t0) / 1000)}s`);
  console.log(`\n⚠ image_embedding 은 비어있음 — \`pnpm portfolio:embed-clip\` 으로 채우세요.`);
}

main().catch((err) => {
  console.error("[seed] fatal:", err);
  process.exit(1);
});
