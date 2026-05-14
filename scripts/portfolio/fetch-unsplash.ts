// Stage 1 — Unsplash 에서 키워드별 이미지 다운로드 (로컬 검수용)
//
// 사용:
//   pnpm portfolio:fetch                        # 기본 카테고리 (hair_type, treatment, style, hair_color)
//   pnpm portfolio:fetch -- --limit=3           # 처음 3개 키워드만 (smoke test)
//   pnpm portfolio:fetch -- --per=5             # 키워드당 5장
//   pnpm portfolio:fetch -- --categories=style  # 특정 카테고리만
//
// 흐름:
//   1) Supabase: keyword + keyword_category fetch (지정 카테고리)
//   2) 각 키워드를 영어 hair 쿼리로 변환 → Unsplash /search/photos
//   3) tmp/portfolio-images/<slug>/01.jpg .. 10.jpg 로 저장
//   4) Unsplash API guideline: download_location 트래킹 호출
//
// idempotent: 같은 슬롯에 파일이 이미 있으면 skip.

import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = ["hair_type", "treatment", "style", "hair_color"];
const DEFAULT_PER_KEYWORD = 10;
const FETCH_OVERSAMPLE = 3; // 키워드당 per * 3 만큼 검색해서 중복 제거 후 첫 per 개 채택
const OUTPUT_ROOT_REL = "tmp/portfolio-images";
const INDEX_FILE = "_index.json";
const REQUEST_DELAY_MS = 800; // Unsplash demo: 50 req/hr → ~72s/req 여유. 보수적으로 0.8s.

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
// Keyword → Unsplash query builder
// ─────────────────────────────────────────────────────────────

// 카테고리별 쿼리 패턴
// - hair_type: "{name} hair"
// - hair_color: "{name} hair color"
// - treatment/style/그 외: "{name} hairstyle"
function buildQuery(keywordName: string, categorySlug: string): string {
  const name = keywordName.trim();
  if (categorySlug === "hair_type") return `${name} hair`;
  if (categorySlug === "hair_color") return `${name} hair color`;
  return `${name} hairstyle`;
}

// ─────────────────────────────────────────────────────────────
// Unsplash client
// ─────────────────────────────────────────────────────────────

type UnsplashPhoto = {
  id: string;
  urls: { raw: string; full: string; regular: string; small: string };
  links: { download_location: string };
  user: { name: string; username: string };
  alt_description: string | null;
};

type UnsplashSearch = {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
};

class Unsplash {
  constructor(private accessKey: string) {}

  private async req<T>(path: string): Promise<T> {
    const res = await fetch(`https://api.unsplash.com${path}`, {
      headers: {
        Authorization: `Client-ID ${this.accessKey}`,
        "Accept-Version": "v1",
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Unsplash ${res.status}: ${text || res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  search(query: string, perPage: number): Promise<UnsplashSearch> {
    const q = encodeURIComponent(query);
    return this.req<UnsplashSearch>(
      `/search/photos?query=${q}&per_page=${perPage}&orientation=portrait`,
    );
  }

  // Unsplash API guideline: download 발생 시 한 번 호출
  async trackDownload(downloadLocation: string): Promise<void> {
    const url = downloadLocation.replace("https://api.unsplash.com", "");
    try {
      await this.req(url);
    } catch (err) {
      // best-effort — 실패해도 메인 흐름엔 영향 X
      console.warn(`[fetch] download tracking failed: ${(err as Error).message}`);
    }
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
// Main
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

async function main() {
  const args = parseArgs();
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) throw new Error("[fetch] UNSPLASH_ACCESS_KEY missing");

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

  const unsplash = new Unsplash(accessKey);

  // 전역 dedup: 같은 photo id 가 여러 키워드에 중복 다운로드 되지 않도록.
  // 기존 _index.json 있으면 그 photoIds 도 로드.
  type IndexEntry = {
    slug: string;
    category: string;
    query: string;
    photos: Array<{
      file: string; // 01.jpg
      unsplash_id: string;
      photographer: string;
      photographer_url: string;
      alt: string | null;
    }>;
  };
  type IndexFile = { entries: IndexEntry[] };

  const indexPath = join(outRoot, INDEX_FILE);
  let index: IndexFile = { entries: [] };
  if (await fileExists(indexPath)) {
    try {
      index = JSON.parse(await readFile(indexPath, "utf-8")) as IndexFile;
    } catch {
      // ignore parse error, start fresh
    }
  }
  const usedPhotoIds = new Set<string>(
    index.entries.flatMap((e) => e.photos.map((p) => p.unsplash_id)),
  );

  const summary: Array<{ slug: string; downloaded: number; skipped: number; failed: number }> = [];

  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i];
    const query = buildQuery(kw.name, kw.category_slug);
    const folder = join(outRoot, kw.slug);

    // 이미 충분히 있으면 skip
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
      // Oversample 후 dedup 해서 첫 per 개 채택
      const result = await unsplash.search(query, args.per * FETCH_OVERSAMPLE);
      if (result.results.length === 0) {
        console.warn(`[fetch]   no results for "${query}"`);
        summary.push({ slug: kw.slug, downloaded: 0, skipped: existing, failed: 0 });
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      const candidates = result.results.filter((p) => !usedPhotoIds.has(p.id));
      if (candidates.length === 0) {
        console.warn(`[fetch]   all ${result.results.length} candidates already used by other keywords`);
      }

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
          const bytes = await downloadImage(photo.urls.regular, dest);
          downloaded++;
          usedPhotoIds.add(photo.id);
          photoLog.push({
            file: fileName,
            unsplash_id: photo.id,
            photographer: photo.user.name,
            photographer_url: `https://unsplash.com/@${photo.user.username}`,
            alt: photo.alt_description,
          });
          unsplash.trackDownload(photo.links.download_location).catch(() => {});
          if (slot === 1) {
            console.log(`[fetch]   first image: ${(bytes / 1024).toFixed(0)}KB by @${photo.user.username} — ${photo.alt_description ?? "(no alt)"}`);
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

      // 인덱스 업데이트 (같은 slug 가 이미 있으면 교체)
      index.entries = index.entries.filter((e) => e.slug !== kw.slug);
      index.entries.push({
        slug: kw.slug,
        category: kw.category_slug,
        query,
        photos: photoLog,
      });
    } catch (err) {
      console.error(`[fetch] ${kw.slug} search failed: ${(err as Error).message}`);
      failed++;
    }

    summary.push({ slug: kw.slug, downloaded, skipped: existing, failed });
    await sleep(REQUEST_DELAY_MS);
  }

  // 인덱스 저장 (다음 실행에서 dedup 에 사용)
  await mkdir(outRoot, { recursive: true });
  await writeFile(indexPath, JSON.stringify(index, null, 2));
  console.log(`[fetch] index saved: ${indexPath}`);

  // 요약
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
