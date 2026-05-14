// Stage 2 — tmp/portfolio-images/<slug>/*.jpg → Supabase Storage 'portfolio' 버킷 업로드
//
// 사용:
//   pnpm portfolio:upload                      # 모든 키워드 업로드 (이미 있으면 skip)
//   pnpm portfolio:upload -- --overwrite       # 같은 경로 덮어쓰기
//   pnpm portfolio:upload -- --slug=balayage   # 특정 키워드만
//
// 흐름:
//   1) 'portfolio' bucket 없으면 생성 (public)
//   2) tmp/portfolio-images/<slug>/<n>.jpg → <slug>/<n>.jpg 경로로 업로드
//   3) DB image_path 에 들어갈 전체 경로는 "portfolio/<slug>/<n>.jpg" (bucket prefix 포함)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const BUCKET = "portfolio";
const SOURCE_REL = "tmp/portfolio-images";
const CONCURRENCY = 8;

// ─────────────────────────────────────────────────────────────
// Args
// ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    overwrite: args.includes("--overwrite"),
    slug: args.find((a) => a.startsWith("--slug="))?.slice("--slug=".length),
  };
}

// ─────────────────────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────────────────────

function makeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("[upload] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// ─────────────────────────────────────────────────────────────
// Bucket helpers
// ─────────────────────────────────────────────────────────────

async function ensureBucket(supabase: SupabaseClient) {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw new Error(`[upload/bucket-list] ${listErr.message}`);
  const existing = buckets?.find((b) => b.name === BUCKET);

  if (existing) {
    console.log(`[upload] bucket '${BUCKET}' exists (public=${existing.public})`);
    return;
  }

  console.log(`[upload] creating bucket '${BUCKET}' (public) ...`);
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (createErr) throw new Error(`[upload/bucket-create] ${createErr.message}`);
  console.log(`[upload] bucket created`);
}

// ─────────────────────────────────────────────────────────────
// Filesystem walk
// ─────────────────────────────────────────────────────────────

type Job = { slug: string; localPath: string; storagePath: string; fileName: string };

async function collectJobs(sourceRoot: string, filterSlug?: string): Promise<Job[]> {
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  const jobs: Job[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith("_")) continue; // _index.json 등 메타
    if (filterSlug && e.name !== filterSlug) continue;

    const slugDir = join(sourceRoot, e.name);
    const files = await readdir(slugDir);
    for (const f of files) {
      if (!/\.(jpg|jpeg|png|webp)$/i.test(f)) continue;
      jobs.push({
        slug: e.name,
        localPath: join(slugDir, f),
        storagePath: `${e.name}/${f}`, // bucket 내부 경로
        fileName: f,
      });
    }
  }
  return jobs;
}

// ─────────────────────────────────────────────────────────────
// Existing path check (in batch via storage list)
// ─────────────────────────────────────────────────────────────

async function listExisting(supabase: SupabaseClient, slug: string): Promise<Set<string>> {
  const { data, error } = await supabase.storage.from(BUCKET).list(slug, { limit: 1000 });
  if (error) {
    // 폴더 미존재면 빈 set
    if (error.message.toLowerCase().includes("not found")) return new Set();
    throw new Error(`[upload/list ${slug}] ${error.message}`);
  }
  return new Set((data ?? []).map((f) => `${slug}/${f.name}`));
}

// ─────────────────────────────────────────────────────────────
// Concurrency helper
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
  const supabase = makeClient();

  await ensureBucket(supabase);

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const sourceRoot = join(__dirname, "../..", SOURCE_REL);

  // 디렉토리 존재 확인
  try {
    await stat(sourceRoot);
  } catch {
    throw new Error(`[upload] source dir not found: ${sourceRoot} — run pnpm portfolio:fetch first`);
  }

  const jobs = await collectJobs(sourceRoot, args.slug);
  console.log(`[upload] ${jobs.length} files to consider${args.slug ? ` (slug=${args.slug})` : ""}`);

  if (jobs.length === 0) {
    console.log("[upload] nothing to upload");
    return;
  }

  // 슬러그별로 그룹화 후 기존 storage 파일 목록 조회
  const slugs = Array.from(new Set(jobs.map((j) => j.slug)));
  console.log(`[upload] checking existing files for ${slugs.length} slugs ...`);
  const existingBySlug = new Map<string, Set<string>>();
  for (const slug of slugs) {
    existingBySlug.set(slug, await listExisting(supabase, slug));
  }

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  await mapWithConcurrency(jobs, CONCURRENCY, async (job, idx) => {
    const existing = existingBySlug.get(job.slug)!;
    if (existing.has(job.storagePath) && !args.overwrite) {
      skipped++;
      return;
    }
    try {
      const buf = await readFile(job.localPath);
      const { error } = await supabase.storage.from(BUCKET).upload(job.storagePath, buf, {
        contentType: "image/jpeg",
        upsert: args.overwrite,
      });
      if (error) throw error;
      uploaded++;
      if ((uploaded + skipped + failed) % 25 === 0) {
        console.log(`[upload] progress: ${uploaded + skipped + failed}/${jobs.length} (up=${uploaded} skip=${skipped})`);
      }
    } catch (err) {
      failed++;
      console.warn(`[upload] ${job.storagePath} failed: ${(err as Error).message}`);
    }
  });

  const elapsed = Math.round((Date.now() - t0) / 1000);
  console.log("\n─── Summary ─────────────────────────");
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Skipped:  ${skipped} (already existed)`);
  console.log(`Failed:   ${failed}`);
  console.log(`Bucket:   ${BUCKET}`);
  console.log(`Elapsed:  ${elapsed}s`);
  console.log(`\nDB image_path 예시: ${BUCKET}/${jobs[0].storagePath}`);
}

main().catch((err) => {
  console.error("[upload] fatal:", err);
  process.exit(1);
});
