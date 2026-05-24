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
import OpenAI from "openai";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const STORAGE_BUCKET = "portfolio";
const SOURCE_REL = "tmp/portfolio-images";
const INDEX_FILE = "_index.json";

const LLM_MODEL = "gpt-4o-mini"; // vision-capable (text + image input)
const BATCH_CONCURRENCY = 5;
const MAX_DESCRIPTION_LEN = 200;
const CHUNK = 100;
const VISION_DETAIL = "low"; // "low" = $0.000425 per image, "high" = more tokens

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

function makeClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!url || !serviceKey) throw new Error("[seed] Supabase env missing");
  if (!openaiKey) throw new Error("[seed] OPENAI_API_KEY missing");
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const openai = new OpenAI({ apiKey: openaiKey });
  return { supabase, openai };
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
// LLM meta
// ─────────────────────────────────────────────────────────────

const LLM_SYSTEM_PROMPT = `You analyze hair-salon portfolio images and generate search metadata.
You will see: the actual image, the primary keyword it should illustrate, and the designer's context.
Return STRICT JSON: { "title": string, "description": string, "keywords": string[], "visual_summary": string }.

Constraints:
- title: 30~80 chars, English, describing what you SEE in the image. e.g. "Tight Coily Afro with Defined Curls"
- description: 80~${MAX_DESCRIPTION_LEN} chars, English. Describe visible hair: length, color, texture, technique. Salon-portfolio tone.
- visual_summary: 50~150 chars, English. Pure visual observation (no marketing). Used for embedding.
- keywords: 3~6 lowercase snake_case slugs. MUST include the primary slug. Add 2~5 from designer's pool that match what you see in the image.

If the image clearly does NOT show hair (e.g. unrelated photo), still produce metadata best matching the primary keyword.
Return ONLY JSON. No prose.`;

function buildLlmUserPrompt(job: Job): string {
  const d = job.designer;
  const specialties = d.designer_keyword
    .filter((k) => k.relation_type === "specialty" && k.keyword)
    .map((k) => k.keyword!.name);
  const experiences = d.designer_keyword
    .filter((k) => k.relation_type === "experience" && k.keyword)
    .map((k) => k.keyword!.name);
  const slugs = d.designer_keyword.map((k) => k.keyword?.slug).filter((s): s is string => !!s);

  return [
    `Primary keyword (must appear in keywords[]): ${job.keywordSlug} ("${job.keywordName}")`,
    `Designer: ${d.display_name ?? "Designer"} (${d.role ?? "stylist"})`,
    `Years of experience: ${d.years_of_exp ?? "n/a"}`,
    d.bio ? `Bio: ${d.bio}` : null,
    specialties.length ? `Specialties: ${specialties.join(", ")}` : null,
    experiences.length ? `Hair-type experience: ${experiences.join(", ")}` : null,
    `Available keyword slug pool: ${Array.from(new Set([job.keywordSlug, ...slugs])).join(", ")}`,
    d.salon?.name ? `Salon: ${d.salon.name}${d.salon.neighborhood ? ` (${d.salon.neighborhood})` : ""}` : null,
    ``,
    `Look at the image and generate metadata accordingly.`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function generateMeta(
  openai: OpenAI,
  job: Job,
  imageUrl: string,
): Promise<{ title: string; description: string; keywords: string[]; visualSummary: string }> {
  const completion = await openai.chat.completions.create({
    model: LLM_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: LLM_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: buildLlmUserPrompt(job) },
          { type: "image_url", image_url: { url: imageUrl, detail: VISION_DETAIL } },
        ],
      },
    ],
    temperature: 0.7,
  });
  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("empty completion");

  const parsed = JSON.parse(text) as Record<string, unknown>;
  const title = String(parsed.title ?? "").trim().slice(0, 200);
  const description = String(parsed.description ?? "").trim().slice(0, MAX_DESCRIPTION_LEN);
  const visualSummary = String(parsed.visual_summary ?? "").trim().slice(0, 300);
  const rawKeywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
  let keywords = rawKeywords
    .map((k) => String(k ?? "").trim().toLowerCase())
    .filter((k) => k.length > 0 && k.length <= 64)
    .slice(0, 8);

  // Primary keyword 강제 포함
  if (!keywords.includes(job.keywordSlug)) keywords = [job.keywordSlug, ...keywords].slice(0, 8);

  if (!title) throw new Error("missing title");
  return { title, description, keywords, visualSummary };
}

// ─────────────────────────────────────────────────────────────
// Concurrency
// ─────────────────────────────────────────────────────────────

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  const args = parseArgs();
  const { supabase, openai } = makeClients();

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

  // 5) 분배 — 글로벌 cursor 로 designer round-robin
  const jobs: Job[] = [];
  let cursor = 0;
  for (const entry of index.entries) {
    const keywordRow = keywordMap.get(entry.slug);
    const keywordName = keywordRow?.name ?? entry.slug;
    for (let i = 0; i < entry.photos.length; i++) {
      const photo = entry.photos[i];
      const designer = designers[cursor % designers.length];
      cursor++;
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

  // 6) Vision LLM 메타 생성 (concurrency 제한). image_embedding 은 별도 단계에서.
  let ok = 0;
  let fail = 0;
  const rows: SeedRow[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publicUrl = (path: string) => `${supabaseUrl}/storage/v1/object/public/${path}`;

  await mapWithConcurrency(jobs, BATCH_CONCURRENCY, async (job, idx) => {
    try {
      const imageUrl = publicUrl(job.imagePath);
      const meta = await generateMeta(openai, job, imageUrl);
      rows.push({
        designer_id: job.designer.id,
        image_path: job.imagePath,
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords,
        display_order: job.fileIndex,
      });
      ok++;
      if ((ok + fail) % 25 === 0) {
        console.log(`[seed] progress: ${ok + fail}/${jobs.length} (ok=${ok} fail=${fail})`);
      }
    } catch (err) {
      fail++;
      console.warn(`[seed] job ${idx} (${job.keywordSlug}/${job.imagePath}) failed: ${(err as Error).message}`);
    }
  });

  console.log(`[seed] generated: ok=${ok} fail=${fail}`);

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
