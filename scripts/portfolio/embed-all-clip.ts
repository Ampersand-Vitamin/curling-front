// portfolio-visual-embedding — CLIP image_embedding 시드.
// Design Ref: §4
//
// portfolio.image_embedding (vector 768) 만 채운다.
// (텍스트 임베딩 컬럼 portfolio.embedding 은 cross-modal 전환 후 DROP 됨)
//
// 사용:
//   pnpm portfolio:embed-clip                # idempotent: image_embedding NULL 인 row 만
//   pnpm portfolio:embed-clip -- --reset     # 360 rows 전부 다시
//   pnpm portfolio:embed-clip -- --limit=5   # smoke
//
// 흐름:
//   1) portfolio fetch (id, image_path, image_embedding)
//   2) tmp/portfolio-images/<slug>/<n>.jpg 로컬 파일 우선, 없으면 Storage public URL fallback
//   3) embedImage(buffer) → 768d
//   4) UPDATE portfolio SET image_embedding = ... WHERE id = ...

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { embedImage, CLIP_DIMS } from "../../src/lib/portfolio-search/clip";

const SOURCE_REL = "tmp/portfolio-images";

const RESET = process.argv.includes("--reset");
const LIMIT = (() => {
  const a = process.argv.find((x) => x.startsWith("--limit="));
  return a ? Number(a.slice("--limit=".length)) : undefined;
})();

type Row = {
  id: string;
  image_path: string;
  image_embedding: number[] | string | null;
};

function makeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("[embed-clip] Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadImageBuffer(imagePath: string, sourceRoot: string): Promise<Buffer> {
  // image_path 예: "portfolio/balayage/01.jpg" → 로컬 후보: <root>/balayage/01.jpg
  const localPath = join(sourceRoot, imagePath.replace(/^portfolio\//, ""));
  if (await fileExists(localPath)) {
    return readFile(localPath);
  }
  // fallback: Storage public URL
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${imagePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const t0 = Date.now();
  const supabase = makeClient();

  console.log("[embed-clip] fetching portfolio rows ...");
  const { data, error } = await supabase
    .from("portfolio")
    .select("id, image_path, image_embedding")
    .range(0, 4999);
  if (error) throw new Error(`[embed-clip/fetch] ${error.message}`);
  const rows = (data ?? []) as Row[];
  console.log(`[embed-clip] ${rows.length} rows fetched`);

  let jobs = rows.filter((r) => RESET || r.image_embedding == null);
  console.log(`[embed-clip] ${jobs.length} rows to process${RESET ? " (--reset)" : ""}`);

  if (LIMIT) {
    jobs = jobs.slice(0, LIMIT);
    console.log(`[embed-clip] limit applied → ${jobs.length}`);
  }

  if (jobs.length === 0) {
    console.log("[embed-clip] nothing to do");
    return;
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const sourceRoot = join(__dirname, "../..", SOURCE_REL);

  // CLIP vision 워밍업 — 첫 호출 동시에 진행해도 OK, 명시 워밍업은 생략
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < jobs.length; i++) {
    const row = jobs[i];
    try {
      const buf = await loadImageBuffer(row.image_path, sourceRoot);
      const v = await embedImage(buf);
      if (v.length !== CLIP_DIMS) throw new Error(`dims mismatch: ${v.length}`);

      const { error: updErr } = await supabase
        .from("portfolio")
        .update({ image_embedding: v })
        .eq("id", row.id);
      if (updErr) throw new Error(`update: ${updErr.message}`);

      ok++;
      if ((ok + fail) % 10 === 0 || i === jobs.length - 1) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
        console.log(`[embed-clip] progress: ${ok + fail}/${jobs.length} (ok=${ok} fail=${fail}) elapsed=${elapsed}s`);
      }
    } catch (err) {
      fail++;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[embed-clip] row ${row.id.slice(0, 8)} (${row.image_path}) failed: ${msg}`);
    }
  }

  const { count: nullImg } = await supabase
    .from("portfolio")
    .select("*", { count: "exact", head: true })
    .is("image_embedding", null);

  console.log("\n─── Summary ─────────────────────────");
  console.log(`Processed: ${ok + fail} (ok=${ok}, fail=${fail})`);
  console.log(`Remaining NULL image_embedding: ${nullImg}`);
  console.log(`Elapsed: ${Math.round((Date.now() - t0) / 1000)}s`);
}

main().catch((err) => {
  console.error("[embed-clip] fatal:", err);
  process.exit(1);
});
