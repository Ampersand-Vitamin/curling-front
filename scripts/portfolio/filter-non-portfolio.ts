// A단계: CLIP 으로 "포트폴리오 느낌 아닌" 이미지 자동 필터링.
//
// 흐름:
//   1) "professional hair salon portfolio close-up photo" 텍스트 임베딩 생성
//   2) DB 에서 360 portfolio rows 의 image_embedding fetch
//   3) 각 row 와 cosine 유사도 계산
//   4) threshold (기본 0.24) 미만인 row 를 "비포트폴리오" 로 분류
//   5) 결과를 slug 별로 그룹핑해서 출력 + JSON 파일 저장
//
// 사용:
//   TRANSFORMERS_CACHE=tmp/transformers-cache pnpm tsx --env-file=.env scripts/portfolio/filter-non-portfolio.ts
//   TRANSFORMERS_CACHE=tmp/transformers-cache pnpm tsx --env-file=.env scripts/portfolio/filter-non-portfolio.ts --threshold=0.22

import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";
import { embedText } from "../../src/lib/portfolio-search/clip";

const REFERENCE_TEXT = "professional hair salon portfolio close-up photo of hairstyle result";
const DEFAULT_THRESHOLD = 0.24;

const THRESHOLD = (() => {
  const a = process.argv.find((x) => x.startsWith("--threshold="));
  return a ? Number(a.slice("--threshold=".length)) : DEFAULT_THRESHOLD;
})();

const DELETE_MODE = process.argv.includes("--delete");

type Row = {
  id: string;
  image_path: string;
  title: string;
  keywords: string[];
  image_embedding: number[];
};

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function slugFromPath(path: string): string {
  // "portfolio/balayage/01.jpg" → "balayage"
  const parts = path.split("/");
  return parts[1] ?? path;
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log("[filter] generating reference embedding ...");
  const refEmb = await embedText(REFERENCE_TEXT);
  console.log(`[filter] reference: "${REFERENCE_TEXT}" → ${refEmb.length}d`);
  console.log(`[filter] threshold: ${THRESHOLD} (below = non-portfolio)\n`);

  const { data, error } = await supabase
    .from("portfolio")
    .select("id, image_path, title, keywords, image_embedding")
    .not("image_embedding", "is", null)
    .range(0, 4999);
  if (error) throw new Error(error.message);

  // pgvector 는 supabase-js 에서 string "[0.01,-0.02,...]" 으로 반환됨 — parse 필요
  const rows: Row[] = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    image_embedding:
      typeof r.image_embedding === "string"
        ? JSON.parse(r.image_embedding) as number[]
        : (r.image_embedding as number[]),
  })) as Row[];
  console.log(`[filter] ${rows.length} rows with image_embedding`);

  type ScoredRow = Row & { sim: number };
  const scored: ScoredRow[] = rows.map((r) => ({
    ...r,
    sim: cosine(refEmb, r.image_embedding),
  }));

  scored.sort((a, b) => a.sim - b.sim);

  const bad = scored.filter((r) => r.sim < THRESHOLD);
  const good = scored.filter((r) => r.sim >= THRESHOLD);

  console.log(`\n─── Results ─────────────────────────`);
  console.log(`Total:         ${scored.length}`);
  console.log(`Below ${THRESHOLD}:    ${bad.length} (non-portfolio candidates)`);
  console.log(`Above ${THRESHOLD}:    ${good.length} (keep)`);

  // 분포 히스토그램 (0.15~0.35 범위 10구간)
  console.log(`\n─── Similarity Distribution ─────────`);
  const bins = Array.from({ length: 10 }, (_, i) => ({ min: 0.15 + i * 0.02, count: 0 }));
  for (const r of scored) {
    const idx = Math.floor((r.sim - 0.15) / 0.02);
    if (idx >= 0 && idx < bins.length) bins[idx].count++;
  }
  for (const b of bins) {
    const bar = "█".repeat(Math.ceil(b.count / 2));
    const marker = Math.abs(b.min + 0.01 - THRESHOLD) < 0.01 ? " ◄ threshold" : "";
    console.log(`  ${b.min.toFixed(2)}~${(b.min + 0.02).toFixed(2)}: ${bar} (${b.count})${marker}`);
  }

  // slug 별 그룹
  console.log(`\n─── Non-portfolio by slug ───────────`);
  const bySlug = new Map<string, ScoredRow[]>();
  for (const r of bad) {
    const slug = slugFromPath(r.image_path);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug)!.push(r);
  }
  const slugEntries = Array.from(bySlug.entries()).sort((a, b) => b[1].length - a[1].length);
  for (const [slug, items] of slugEntries) {
    console.log(`  ${slug}: ${items.length} images`);
    for (const r of items.slice(0, 3)) {
      console.log(`    [${r.sim.toFixed(3)}] ${r.image_path} — ${r.title}`);
    }
    if (items.length > 3) console.log(`    ... +${items.length - 3} more`);
  }

  // 최하위 10개 상세
  console.log(`\n─── Bottom 10 (worst matches) ───────`);
  for (const r of scored.slice(0, 10)) {
    console.log(`  [${r.sim.toFixed(3)}] ${r.image_path}`);
    console.log(`         ${r.title}`);
  }

  // --delete: DB 에서 non-portfolio rows 삭제
  if (DELETE_MODE && bad.length > 0) {
    const ids = bad.map((r) => r.id);
    console.log(`\n─── Deleting ${ids.length} non-portfolio rows ─────────`);
    const CHUNK = 100;
    let deleted = 0;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const { error: delErr } = await supabase
        .from("portfolio")
        .delete()
        .in("id", chunk);
      if (delErr) {
        console.error(`[filter/delete] chunk ${i / CHUNK + 1} failed:`, delErr.message);
        throw delErr;
      }
      deleted += chunk.length;
      console.log(`[filter] deleted ${deleted}/${ids.length}`);
    }
    console.log(`[filter] ✓ ${deleted} rows deleted`);
  } else if (DELETE_MODE) {
    console.log(`\n[filter] no rows to delete`);
  }

  // 결과 JSON 저장
  const output = {
    referenceText: REFERENCE_TEXT,
    threshold: THRESHOLD,
    totalRows: scored.length,
    nonPortfolioCount: bad.length,
    deleted: DELETE_MODE,
    nonPortfolio: bad.map((r) => ({
      id: r.id,
      image_path: r.image_path,
      slug: slugFromPath(r.image_path),
      title: r.title,
      similarity: Number(r.sim.toFixed(4)),
    })),
  };
  const outPath = "tmp/portfolio-images/_non_portfolio.json";
  await writeFile(outPath, JSON.stringify(output, null, 2));
  console.log(`\n[filter] saved: ${outPath}`);
}

main().catch((err) => {
  console.error("[filter] fatal:", err);
  process.exit(1);
});
