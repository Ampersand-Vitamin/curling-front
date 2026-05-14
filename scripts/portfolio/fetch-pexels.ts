// Stage 1 (Pexels 버전) — 키워드별 이미지 다운로드
//
// 왜 Pexels 인가:
//   - Unsplash demo 키는 50 req/hr 한도라 download_location 트래킹 포함 시 ~3 키워드 만에 소진
//   - Pexels free tier: 200 req/hr, 20,000/month
//   - 트래킹 의무 없음
//
// 사용:
//   pnpm portfolio:fetch                        # 기본 (hair_type, treatment, style, hair_color)
//   pnpm portfolio:fetch -- --limit=3           # smoke test
//   pnpm portfolio:fetch -- --per=5             # 키워드당 5장
//   pnpm portfolio:fetch -- --categories=style  # 특정 카테고리만
//
// 출력:
//   tmp/portfolio-images/<slug>/01.jpg .. 10.jpg
//   tmp/portfolio-images/_index.json  ← 시드 스크립트가 소비

import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = ["hair_type", "treatment", "style", "hair_color"];
const DEFAULT_PER_KEYWORD = 10;
const FETCH_OVERSAMPLE = 3; // dedup 여유분
const OUTPUT_ROOT_REL = "tmp/portfolio-images";
const INDEX_FILE = "_index.json";
const REQUEST_DELAY_MS = 300; // 200/hr → 18s/req 여유, 0.3s 충분

// ─────────────────────────────────────────────────────────────
// Args
// ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (key: string) => {
    const arg = args.find((a) => a.startsWith(`--${key}=`));
    return arg ? arg.slice(`--${key}=`.length) : undefined;
  };
  return {
    limit: get("limit") ? Number(get("limit")) : undefined,
    per: get("per") ? Number(get("per")) : DEFAULT_PER_KEYWORD,
    categories: get("categories")?.split(",") ?? DEFAULT_CATEGORIES,
  };
}

// ─────────────────────────────────────────────────────────────
// Keyword → Pexels query
// ─────────────────────────────────────────────────────────────

function buildQuery(keywordName: string, categorySlug: string): string {
  const name = keywordName.trim();
  if (categorySlug === "hair_type") return `${name} hair`;
  if (categorySlug === "hair_color") return `${name} hair color`;
  return `${name} hairstyle`;
}

// ─────────────────────────────────────────────────────────────
// Pexels client
// ─────────────────────────────────────────────────────────────

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  photographer: string;
  photographer_url: string;
  alt: string | null;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    portrait: string;
    landscape: string;
  };
};

type PexelsSearch = {
  total_results: number;
  photos: PexelsPhoto[];
};

class Pexels {
  constructor(private apiKey: string) {}

  async search(query: string, perPage: number, orientation: "portrait" | "landscape" = "portrait"): Promise<PexelsSearch> {
    const q = encodeURIComponent(query);
    const url = `https://api.pexels.com/v1/search?query=${q}&per_page=${Math.min(perPage, 80)}&orientation=${orientation}`;
    const res = await fetch(url, {
      headers: { Authorization: this.apiKey },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Pexels ${res.status}: ${text || res.statusText}`);
    }
    return res.json() as Promise<PexelsSearch>;
  }
}

// ─────────────────────────────────────────────────────────────
// Filesystem helpers
// ─────────────────────────────────────────────────────────────

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(url: string, dest: string): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image download ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return buf.byteLength;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────
// Supabase: keyword fetch
// ─────────────────────────────────────────────────────────────

type KeywordRow = {
  id: string;
  slug: string;
  name: string;
  category_slug: string;
};

async function fetchKeywords(categories: string[]): Promise<KeywordRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("[fetch] Supabase env missing");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("keyword")
    .select("id, slug, name, keyword_category!inner(slug)")
    .in("keyword_category.slug", categories);
  if (error) throw new Error(`[fetch/keyword] ${error.message}`);

  return (data ?? []).map((r: { id: string; slug: string; name: string; keyword_category: { slug: string } }) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category_slug: r.keyword_category.slug,
  }));
}

// ─────────────────────────────────────────────────────────────
// Index (for dedup + downstream upload)
// ─────────────────────────────────────────────────────────────

type IndexEntry = {
  slug: string;
  category: string;
  query: string;
  provider: "pexels";
  photos: Array<{
    file: string;
    photo_id: string;
    photographer: string;
    photographer_url: string;
    alt: string | null;
    source_url: string;
  }>;
};

type IndexFile = { entries: IndexEntry[] };

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) throw new Error("[fetch] PEXELS_API_KEY missing");

  console.log(`[fetch] provider: pexels`);
  console.log(`[fetch] categories: ${args.categories.join(", ")}`);
  console.log(`[fetch] per keyword: ${args.per}`);

  let keywords = await fetchKeywords(args.categories);
  console.log(`[fetch] ${keywords.length} keywords from DB`);

  if (args.limit) {
    keywords = keywords.slice(0, args.limit);
    console.log(`[fetch] limit applied → ${keywords.length} keywords`);
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outRoot = join(__dirname, "../..", OUTPUT_ROOT_REL);
  const indexPath = join(outRoot, INDEX_FILE);

  let index: IndexFile = { entries: [] };
  if (await fileExists(indexPath)) {
    try {
      index = JSON.parse(await readFile(indexPath, "utf-8")) as IndexFile;
    } catch {
      // ignore
    }
  }
  const usedPhotoIds = new Set<string>(
    index.entries.flatMap((e) => e.photos.map((p) => p.photo_id)),
  );

  const pexels = new Pexels(apiKey);

  const summary: Array<{ slug: string; downloaded: number; skipped: number; failed: number }> = [];

  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i];
    const query = buildQuery(kw.name, kw.category_slug);
    const folder = join(outRoot, kw.slug);

    let existing = 0;
    for (let n = 1; n <= args.per; n++) {
      if (await fileExists(join(folder, `${String(n).padStart(2, "0")}.jpg`))) existing++;
    }
    if (existing >= args.per) {
      console.log(`[fetch] [${i + 1}/${keywords.length}] ${kw.slug} — already has ${existing}, skip`);
      summary.push({ slug: kw.slug, downloaded: 0, skipped: existing, failed: 0 });
      continue;
    }

    console.log(`[fetch] [${i + 1}/${keywords.length}] ${kw.slug} ← "${query}"`);

    let downloaded = 0;
    let failed = 0;
    const photoLog: IndexEntry["photos"] = [];

    try {
      const result = await pexels.search(query, args.per * FETCH_OVERSAMPLE);
      if (result.photos.length === 0) {
        console.warn(`[fetch]   no results for "${query}"`);
        summary.push({ slug: kw.slug, downloaded: 0, skipped: existing, failed: 0 });
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      const candidates = result.photos.filter((p) => !usedPhotoIds.has(String(p.id)));

      let slot = 1;
      for (const photo of candidates) {
        if (slot > args.per) break;
        const fileName = `${String(slot).padStart(2, "0")}.jpg`;
        const dest = join(folder, fileName);
        if (await fileExists(dest)) {
          slot++;
          continue;
        }
        try {
          const bytes = await downloadImage(photo.src.large, dest);
          downloaded++;
          usedPhotoIds.add(String(photo.id));
          photoLog.push({
            file: fileName,
            photo_id: String(photo.id),
            photographer: photo.photographer,
            photographer_url: photo.photographer_url,
            alt: photo.alt,
            source_url: photo.src.large,
          });
          if (slot === 1) {
            console.log(`[fetch]   first: ${(bytes / 1024).toFixed(0)}KB by ${photo.photographer} — ${photo.alt ?? "(no alt)"}`);
          }
          slot++;
        } catch (err) {
          failed++;
          console.warn(`[fetch]   image ${slot} failed: ${(err as Error).message}`);
        }
      }

      if (downloaded < args.per) {
        console.warn(`[fetch]   only ${downloaded}/${args.per} unique images for ${kw.slug}`);
      }

      // 인덱스 갱신
      index.entries = index.entries.filter((e) => e.slug !== kw.slug);
      index.entries.push({
        slug: kw.slug,
        category: kw.category_slug,
        query,
        provider: "pexels",
        photos: photoLog,
      });
    } catch (err) {
      console.error(`[fetch] ${kw.slug} search failed: ${(err as Error).message}`);
      failed++;
    }

    summary.push({ slug: kw.slug, downloaded, skipped: existing, failed });
    await sleep(REQUEST_DELAY_MS);
  }

  await mkdir(outRoot, { recursive: true });
  await writeFile(indexPath, JSON.stringify(index, null, 2));
  console.log(`[fetch] index saved: ${indexPath}`);

  console.log("\n─── Summary ─────────────────────────");
  const totalDownloaded = summary.reduce((s, r) => s + r.downloaded, 0);
  const totalSkipped = summary.reduce((s, r) => s + r.skipped, 0);
  const totalFailed = summary.reduce((s, r) => s + r.failed, 0);
  console.log(`Keywords processed: ${summary.length}`);
  console.log(`Images downloaded:  ${totalDownloaded}`);
  console.log(`Images skipped:     ${totalSkipped} (already present)`);
  console.log(`Failed:             ${totalFailed}`);
  console.log(`Output: ${outRoot}`);
}

main().catch((err) => {
  console.error("[fetch] fatal:", err);
  process.exit(1);
});
