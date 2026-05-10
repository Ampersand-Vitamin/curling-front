// Portfolio mock 데이터 시드.
//
// 사용:
//   pnpm portfolio:seed         # idempotent: 같은 (designer_id, image_path) skip
//   pnpm portfolio:reset        # 기존 portfolio rows 전부 삭제 후 재생성
//
// 흐름:
//   1) Supabase 에서 designer_profile + designer_keyword + keyword + salon fetch
//   2) 각 디자이너의 portfolio_images[] 순회
//   3) 이미 portfolio 테이블에 동일 (designer_id, image_path) 있으면 skip
//   4) gpt-4o-mini 로 title/description/keywords 합성 (디자이너 컨텍스트 기반)
//   5) text-embedding-3-large 로 임베딩 생성 (dimensions=1536)
//   6) INSERT — search_doc 은 trigger 가 자동 생성
//
// 비용 추정:
//   - LLM (gpt-4o-mini): 750 rows × ~700 tokens → ~$0.15
//   - 임베딩 (text-embedding-3-large): 750 rows × ~150 tokens → ~$0.015
//   - 합 ≈ $0.20
//
// 참고: 동시성은 BATCH_CONCURRENCY 로 제한. 너무 높이면 OpenAI 429.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const LLM_MODEL = "gpt-4o-mini";
const EMBED_MODEL = "text-embedding-3-large";
const EMBED_DIMENSIONS = 1536;
const BATCH_CONCURRENCY = 5;
const MAX_DESCRIPTION_LEN = 200;

const RESET_FLAG = process.argv.includes("--reset");

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type DesignerSeedRow = {
  id: string;
  display_name: string | null;
  role: string | null;
  bio: string | null;
  highlight_message: string | null;
  years_of_exp: number | null;
  languages: string[] | null;
  portfolio_images: string[] | null;
  salon: { name: string; neighborhood: string | null } | null;
  designer_keyword: Array<{
    relation_type: "specialty" | "experience";
    keyword: { slug: string; name: string } | null;
  }>;
};

type PortfolioMeta = {
  title: string;
  description: string;
  keywords: string[];
};

type SeedRow = {
  designer_id: string;
  image_path: string;
  title: string;
  description: string;
  keywords: string[];
  display_order: number;
  embedding: number[];
};

// ─────────────────────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────────────────────

function makeClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "[seed] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정",
    );
  }
  if (!openaiKey) {
    throw new Error("[seed] OPENAI_API_KEY 미설정");
  }
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const openai = new OpenAI({ apiKey: openaiKey });
  return { supabase, openai };
}

// ─────────────────────────────────────────────────────────────
// Fetch designers + nested context
// ─────────────────────────────────────────────────────────────

async function fetchDesigners(supabase: SupabaseClient): Promise<DesignerSeedRow[]> {
  const { data, error } = await supabase
    .from("designer_profile")
    .select(
      `
      id, display_name, role, bio, highlight_message, years_of_exp, languages,
      portfolio_images,
      salon:salon_id ( name, neighborhood ),
      designer_keyword (
        relation_type,
        keyword:keyword_id ( slug, name )
      )
      `,
    )
    .range(0, 4999);
  if (error) throw new Error(`[seed/fetch] ${error.message}`);
  return (data ?? []) as unknown as DesignerSeedRow[];
}

// ─────────────────────────────────────────────────────────────
// LLM mock generation
// ─────────────────────────────────────────────────────────────

const LLM_SYSTEM_PROMPT = `You generate realistic mock metadata for hair-salon portfolio photos.
You will receive a designer's context (specialties, languages, bio).
Return STRICT JSON with exactly: { "title": string, "description": string, "keywords": string[] }.
Constraints:
- title: 30~80 chars, no quotes, English. e.g. "Caramel Balayage on Long Layered Cut"
- description: 50~${MAX_DESCRIPTION_LEN} chars, English, factual tone, no marketing fluff.
- keywords: 3~6 lowercase snake_case slugs from the designer's keyword pool when possible. e.g. ["balayage","curly_hair","highlights"]
- Keep variety: same designer's portfolios should differ in title/keyword combination, not repeat.
Return ONLY JSON. No prose.`;

function buildLlmUserPrompt(d: DesignerSeedRow, portfolioIndex: number, totalForDesigner: number): string {
  const specialties = d.designer_keyword
    .filter((k) => k.relation_type === "specialty" && k.keyword)
    .map((k) => k.keyword!.name);
  const experiences = d.designer_keyword
    .filter((k) => k.relation_type === "experience" && k.keyword)
    .map((k) => k.keyword!.name);
  const slugs = d.designer_keyword
    .map((k) => k.keyword?.slug)
    .filter((s): s is string => !!s);

  return [
    `Designer: ${d.display_name ?? "Designer"} (${d.role ?? "stylist"})`,
    `Years of experience: ${d.years_of_exp ?? "n/a"}`,
    d.bio ? `Bio: ${d.bio}` : null,
    specialties.length ? `Specialties: ${specialties.join(", ")}` : null,
    experiences.length ? `Hair-type experience: ${experiences.join(", ")}` : null,
    `Available keyword slug pool: ${slugs.join(", ")}`,
    d.salon?.name ? `Salon: ${d.salon.name}${d.salon.neighborhood ? ` (${d.salon.neighborhood})` : ""}` : null,
    `Portfolio image: ${portfolioIndex + 1} of ${totalForDesigner}`,
    ``,
    `Generate one portfolio entry. Vary from sibling portfolios by emphasizing different specialty/keyword combinations.`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function generateMeta(
  openai: OpenAI,
  designer: DesignerSeedRow,
  portfolioIndex: number,
  totalForDesigner: number,
): Promise<PortfolioMeta> {
  const completion = await openai.chat.completions.create({
    model: LLM_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: LLM_SYSTEM_PROMPT },
      { role: "user", content: buildLlmUserPrompt(designer, portfolioIndex, totalForDesigner) },
    ],
    temperature: 0.7,
  });
  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("[seed/llm] empty completion");

  const parsed = JSON.parse(text) as unknown;
  const meta = parsed as Record<string, unknown>;

  const title = String(meta.title ?? "").trim().slice(0, 200);
  const description = String(meta.description ?? "").trim().slice(0, MAX_DESCRIPTION_LEN);
  const rawKeywords = Array.isArray(meta.keywords) ? meta.keywords : [];
  const keywords = rawKeywords
    .map((k) => String(k ?? "").trim().toLowerCase())
    .filter((k) => k.length > 0 && k.length <= 64)
    .slice(0, 8);

  if (!title) throw new Error("[seed/llm] missing title");
  return { title, description, keywords };
}

// ─────────────────────────────────────────────────────────────
// Embedding
// ─────────────────────────────────────────────────────────────

function buildEmbedText(designer: DesignerSeedRow, meta: PortfolioMeta): string {
  return [
    meta.title,
    meta.description,
    `Keywords: ${meta.keywords.join(", ")}`,
    `Designer: ${designer.display_name ?? ""}${designer.role ? ` (${designer.role})` : ""}`,
    designer.salon?.name ? `Salon: ${designer.salon.name}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

async function generateEmbedding(openai: OpenAI, text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text,
    dimensions: EMBED_DIMENSIONS,
  });
  const v = res.data[0]?.embedding;
  if (!v || v.length !== EMBED_DIMENSIONS) {
    throw new Error(`[seed/embed] unexpected dimensions: ${v?.length}`);
  }
  return v;
}

// ─────────────────────────────────────────────────────────────
// Concurrency helper — simple bounded batch
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
  const { supabase, openai } = makeClients();

  if (RESET_FLAG) {
    console.log("[seed] --reset flag — deleting all existing portfolio rows ...");
    const { error } = await supabase.from("portfolio").delete().not("id", "is", null);
    if (error) throw new Error(`[seed/reset] ${error.message}`);
    console.log("[seed] reset done");
  }

  console.log("[seed] fetching designers ...");
  const designers = await fetchDesigners(supabase);
  console.log(`[seed] ${designers.length} designers`);

  // 이미 존재하는 (designer_id, image_path) → skip 용 set
  console.log("[seed] checking existing portfolio rows ...");
  const { data: existingRows, error: existingErr } = await supabase
    .from("portfolio")
    .select("designer_id, image_path");
  if (existingErr) throw new Error(`[seed/existing] ${existingErr.message}`);
  const existing = new Set(
    (existingRows ?? []).map((r) => `${r.designer_id}::${r.image_path}`),
  );
  console.log(`[seed] ${existing.size} rows already present`);

  // (designer, imagePath, idx) 평탄화
  type Job = { designer: DesignerSeedRow; imagePath: string; index: number; total: number };
  const jobs: Job[] = [];
  for (const d of designers) {
    const images = (d.portfolio_images ?? []).filter(
      (p): p is string => typeof p === "string" && p.length > 0,
    );
    for (let i = 0; i < images.length; i++) {
      const key = `${d.id}::${images[i]}`;
      if (existing.has(key)) continue;
      jobs.push({ designer: d, imagePath: images[i], index: i, total: images.length });
    }
  }
  console.log(`[seed] ${jobs.length} new portfolio entries to generate`);

  if (jobs.length === 0) {
    console.log("[seed] nothing to do (use --reset to regenerate)");
    return;
  }

  // 메타 생성 + 임베딩 생성 (concurrency 제한)
  let succeeded = 0;
  let failed = 0;
  const seedRows: SeedRow[] = [];

  await mapWithConcurrency(jobs, BATCH_CONCURRENCY, async (job, idx) => {
    try {
      const meta = await generateMeta(openai, job.designer, job.index, job.total);
      const embedText = buildEmbedText(job.designer, meta);
      const embedding = await generateEmbedding(openai, embedText);
      seedRows.push({
        designer_id: job.designer.id,
        image_path: job.imagePath,
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords,
        display_order: job.index,
        embedding,
      });
      succeeded++;
      if ((succeeded + failed) % 10 === 0) {
        console.log(`[seed] progress: ${succeeded + failed}/${jobs.length}`);
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[seed] job ${idx} failed (${job.designer.display_name}/${job.imagePath}): ${msg}`);
    }
  });

  console.log(`[seed] generated: ok=${succeeded} fail=${failed} (of ${jobs.length})`);

  // INSERT — chunk 100 씩
  console.log(`[seed] inserting ${seedRows.length} rows ...`);
  const CHUNK = 100;
  for (let i = 0; i < seedRows.length; i += CHUNK) {
    const chunk = seedRows.slice(i, i + CHUNK);
    const { error } = await supabase.from("portfolio").insert(chunk);
    if (error) {
      console.error(`[seed/insert] chunk ${i / CHUNK + 1} failed:`, error.message);
      throw error;
    }
    console.log(`[seed] inserted ${Math.min(i + CHUNK, seedRows.length)}/${seedRows.length}`);
  }

  const { count } = await supabase
    .from("portfolio")
    .select("*", { count: "exact", head: true });
  console.log(`[seed] done. portfolio total rows: ${count}`);

  const elapsed = Math.round((Date.now() - t0) / 1000);
  console.log(`[seed] elapsed: ${elapsed}s`);
}

main().catch((err) => {
  console.error("[seed] fatal:", err);
  process.exit(1);
});
