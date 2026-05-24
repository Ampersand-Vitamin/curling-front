// Pinterest 크롤러 — Playwright headless browser 로 키워드별 포트폴리오 이미지 수집
//
// Pinterest 내부 API 가 403 차단되어 Playwright 기반으로 전환.
// 3단계 데이터 추출:
//   1) API response 인터셉트 (BaseSearchResource) — 메타데이터 완전
//   2) __PWS_DATA__ SSR JSON 파싱 — fallback
//   3) DOM img 스크래핑 + URL 업스케일 — last resort
//
// 사전 준비:
//   npx playwright install chromium   # 최초 1회
//
// 사용:
//   pnpm portfolio:fetch-pinterest                        # 기본
//   pnpm portfolio:fetch-pinterest -- --limit=3           # smoke test
//   pnpm portfolio:fetch-pinterest -- --per=5             # 키워드당 5장
//   pnpm portfolio:fetch-pinterest -- --categories=style  # 특정 카테고리만
//
// 출력:
//   tmp/portfolio-images/<slug>/pin_01.jpg .. pin_10.jpg
//   tmp/portfolio-images/_index.json 에 provider: "pinterest" 항목 추가
//
// 주의: Pinterest ToS상 대량 크롤링 금지. 시드 데이터용 소량 수집만 사용할 것.

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = ["hair_type", "treatment", "style", "hair_color"];
const DEFAULT_PER_KEYWORD = 10;
const OUTPUT_ROOT_REL = "tmp/portfolio-images";
const INDEX_FILE = "_index.json";
const REQUEST_DELAY_MS = 2000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const FILE_PREFIX = "pin_";

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
// Query builder
// ─────────────────────────────────────────────────────────────

const QUERY_OVERRIDES: Record<string, string> = {
  big_chop:           "big chop haircut transformation salon portfolio",
  bleach_and_tone:    "bleach tone hair color salon result portfolio",
  coily_hair_4a_4c:   "4c coily natural hair salon",
  afro_textured_hair: "afro textured hair natural salon",
  locs:               "locs dreadlocks hairstyle salon",
  digital_perm:       "digital perm hairstyle salon result",
  head_spa:           "head spa treatment hair salon",
  mixed_texture_hair: "mixed texture hair salon",
  curly_hair_3a_3c:   "curly hair 3a 3b salon",
  taper:              "taper fade haircut barber",
  undercut:           "undercut hairstyle barber",
};

function buildQuery(keywordName: string, categorySlug: string, keywordSlug?: string): string {
  if (keywordSlug && QUERY_OVERRIDES[keywordSlug]) return QUERY_OVERRIDES[keywordSlug];
  const name = keywordName.trim();
  if (categorySlug === "hair_type") return `${name} hair salon`;
  if (categorySlug === "hair_color") return `${name} hair color salon`;
  return `${name} hairstyle salon portfolio`;
}

// ─────────────────────────────────────────────────────────────
// Pinterest Playwright scraper
// ─────────────────────────────────────────────────────────────

type PinResult = {
  id: string;
  imageUrl: string;
  description: string | null;
  pinner: string;
  pinnerUrl: string;
};

class PinterestScraper {
  private browser!: Browser;
  private context!: BrowserContext;

  async init(): Promise<void> {
    try {
      this.browser = await chromium.launch({ headless: true });
    } catch (err) {
      console.error(
        "[pinterest] Chromium 브라우저를 찾을 수 없습니다.\n" +
          "  npx playwright install chromium  명령으로 설치하세요.",
      );
      throw err;
    }
    this.context = await this.browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 900 },
      locale: "en-US",
    });
  }

  async search(query: string, count: number): Promise<PinResult[]> {
    const page = await this.context.newPage();

    // ── Strategy 1: API 응답 인터셉트 ──
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const apiPins: any[] = [];
    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("BaseSearchResource") || url.includes("SearchPinResource")) {
        try {
          const json = await res.json();
          const results: any[] = json?.resource_response?.data?.results ?? [];
          apiPins.push(...results.filter((r: any) => r?.images));
        } catch {
          /* non-JSON response — ignore */
        }
      }
    });

    const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

    // 핀 이미지가 나타날 때까지 대기
    try {
      await page.waitForSelector('img[src*="pinimg.com"]', { timeout: 8000 });
    } catch {
      // 다른 방식으로 렌더링되었을 수 있음
    }

    // 로그인/회원가입 모달 제거
    await this.dismissModal(page);

    // 스크롤로 추가 핀 로드
    const scrolls = Math.min(Math.ceil(count / 20), 5);
    for (let i = 0; i < scrolls; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(1500);
      await this.dismissModal(page);
    }

    // pending API 응답 대기
    await sleep(1000);

    let results: PinResult[] = [];

    // Strategy 1: 인터셉트된 API 데이터 (메타데이터 완전)
    if (apiPins.length > 0) {
      results = this.extractFromApiData(apiPins);
      console.log(`[pinterest]   strategy: API intercept (${results.length} pins)`);
    }

    // Strategy 2: __PWS_DATA__ SSR JSON
    if (results.length === 0) {
      results = await this.extractFromPwsData(page);
      if (results.length > 0) {
        console.log(`[pinterest]   strategy: __PWS_DATA__ (${results.length} pins)`);
      }
    }

    // Strategy 3: DOM img 스크래핑 + URL 업스케일
    if (results.length === 0) {
      results = await this.extractFromDom(page);
      if (results.length > 0) {
        console.log(`[pinterest]   strategy: DOM scrape (${results.length} pins)`);
      }
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    await page.close();
    return results;
  }

  /** 로그인/회원가입 모달 제거 + 스크롤 복원 */
  private async dismissModal(page: Page): Promise<void> {
    try {
      await page.evaluate(() => {
        // 모달 + 오버레이 제거
        document
          .querySelectorAll(
            '[data-test-id="unauth-modal"], [data-test-id="signup-modal"], ' +
              '[class*="SignupModal"], [class*="UnauthModal"], ' +
              '[class*="Modal__overlay"], [class*="Overlay"]',
          )
          .forEach((el) => (el as HTMLElement).remove());
        // 스크롤 복원
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";
      });
    } catch {
      /* ignore */
    }
    // ESC 키로도 닫기 시도
    try {
      await page.keyboard.press("Escape");
    } catch {
      /* ignore */
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractFromApiData(apiPins: any[]): PinResult[] {
    const results: PinResult[] = [];
    const seen = new Set<string>();

    for (const pin of apiPins) {
      if (!pin?.images) continue;
      const id = String(pin.id);
      if (seen.has(id)) continue;
      seen.add(id);

      const imageUrl =
        pin.images?.orig?.url ?? pin.images?.["736x"]?.url ?? pin.images?.["564x"]?.url;
      if (!imageUrl) continue;

      results.push({
        id,
        imageUrl,
        description: pin.description ?? pin.grid_description ?? null,
        pinner: pin.pinner?.username ?? "unknown",
        pinnerUrl: pin.pinner?.username
          ? `https://pinterest.com/${pin.pinner.username}`
          : "",
      });
    }
    return results;
  }

  private async extractFromPwsData(page: Page): Promise<PinResult[]> {
    try {
      const raw = await page.evaluate(() => {
        const script = document.getElementById("__PWS_DATA__");
        return script?.textContent ?? null;
      });
      if (!raw) return [];

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const pws = JSON.parse(raw) as any;
      const pins: Record<string, any> = pws?.props?.initialReduxState?.pins ?? {};
      /* eslint-enable @typescript-eslint/no-explicit-any */

      const results: PinResult[] = [];
      for (const pin of Object.values(pins)) {
        const imageUrl = pin.images?.orig?.url ?? pin.images?.["736x"]?.url;
        if (!imageUrl) continue;
        results.push({
          id: String(pin.id),
          imageUrl,
          description: pin.description ?? null,
          pinner: pin.pinner?.username ?? "unknown",
          pinnerUrl: pin.pinner?.username
            ? `https://pinterest.com/${pin.pinner.username}`
            : "",
        });
      }
      return results;
    } catch {
      return [];
    }
  }

  private async extractFromDom(page: Page): Promise<PinResult[]> {
    const raw = await page.evaluate(() => {
      const results: Array<{ id: string; src: string; alt: string }> = [];
      const seen = new Set<string>();

      document.querySelectorAll('img[src*="i.pinimg.com"]').forEach((img) => {
        const src = (img as HTMLImageElement).src;
        if (!src || seen.has(src)) return;
        seen.add(src);

        // 부모 링크에서 pin ID 추출
        const link = img.closest('a[href*="/pin/"]');
        const href = link?.getAttribute("href") || "";
        const id =
          href.match(/\/pin\/(\d+)/)?.[1] ||
          src
            .split("/")
            .slice(-2)
            .join("_")
            .replace(/\.\w+$/, "");

        results.push({
          id,
          src,
          alt: (img as HTMLImageElement).alt || "",
        });
      });
      return results;
    });

    return raw.map((p) => ({
      id: p.id,
      // 썸네일 → 736x 업스케일
      imageUrl: p.src.replace(/i\.pinimg\.com\/\d+x\//, "i.pinimg.com/736x/"),
      description: p.alt || null,
      pinner: "unknown",
      pinnerUrl: "",
    }));
  }

  async close(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
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
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`download ${res.status}: ${url}`);
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

type KeywordRow = { id: string; slug: string; name: string; category_slug: string };

type SupabaseKeywordRow = {
  id: string;
  slug: string;
  name: string;
  keyword_category: { slug: string } | { slug: string }[];
};

function toKeywordRow(row: SupabaseKeywordRow): KeywordRow {
  const category = Array.isArray(row.keyword_category)
    ? row.keyword_category[0]
    : row.keyword_category;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category_slug: category.slug,
  };
}

async function fetchKeywords(categories: string[]): Promise<KeywordRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("[pinterest] Supabase env missing");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("keyword")
    .select("id, slug, name, keyword_category!inner(slug)")
    .in("keyword_category.slug", categories);
  if (error) throw new Error(`[pinterest/keyword] ${error.message}`);
  return ((data ?? []) as SupabaseKeywordRow[]).map(toKeywordRow);
}

// ─────────────────────────────────────────────────────────────
// Index
// ─────────────────────────────────────────────────────────────

type IndexEntry = {
  slug: string;
  category: string;
  query: string;
  provider: string;
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

  console.log(`[pinterest] provider: pinterest (Playwright headless)`);
  console.log(`[pinterest] categories: ${args.categories.join(", ")}`);
  console.log(`[pinterest] per keyword: ${args.per}`);

  let keywords = await fetchKeywords(args.categories);
  console.log(`[pinterest] ${keywords.length} keywords from DB`);

  if (args.limit) {
    keywords = keywords.slice(0, args.limit);
    console.log(`[pinterest] limit → ${keywords.length} keywords`);
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outRoot = join(__dirname, "../..", OUTPUT_ROOT_REL);
  const indexPath = join(outRoot, INDEX_FILE);

  let index: IndexFile = { entries: [] };
  if (await fileExists(indexPath)) {
    try {
      index = JSON.parse(await readFile(indexPath, "utf-8")) as IndexFile;
    } catch {
      /* ignore */
    }
  }

  const usedPinIds = new Set<string>(
    index.entries
      .filter((e) => e.provider === "pinterest")
      .flatMap((e) => e.photos.map((p) => p.photo_id)),
  );

  const scraper = new PinterestScraper();
  console.log("[pinterest] launching headless browser...");
  await scraper.init();

  const summary: Array<{
    slug: string;
    downloaded: number;
    skipped: number;
    failed: number;
  }> = [];

  try {
    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];
      const query = buildQuery(kw.name, kw.category_slug, kw.slug);
      const folder = join(outRoot, kw.slug);

      let existing = 0;
      for (let n = 1; n <= args.per; n++) {
        if (await fileExists(join(folder, `${FILE_PREFIX}${String(n).padStart(2, "0")}.jpg`)))
          existing++;
      }
      if (existing >= args.per) {
        console.log(
          `[pinterest] [${i + 1}/${keywords.length}] ${kw.slug} — already ${existing}, skip`,
        );
        summary.push({ slug: kw.slug, downloaded: 0, skipped: existing, failed: 0 });
        continue;
      }

      console.log(`[pinterest] [${i + 1}/${keywords.length}] ${kw.slug} ← "${query}"`);

      let downloaded = 0;
      let failed = 0;
      const photoLog: IndexEntry["photos"] = [];

      try {
        const pins = await scraper.search(query, args.per * 3);

        if (pins.length === 0) {
          console.warn(`[pinterest]   no results for "${query}"`);
          summary.push({ slug: kw.slug, downloaded: 0, skipped: existing, failed: 0 });
          await sleep(REQUEST_DELAY_MS);
          continue;
        }

        const unique = pins.filter((p) => !usedPinIds.has(p.id));
        let slot = 1;

        for (const pin of unique) {
          if (slot > args.per) break;
          const fileName = `${FILE_PREFIX}${String(slot).padStart(2, "0")}.jpg`;
          const dest = join(folder, fileName);
          if (await fileExists(dest)) {
            slot++;
            continue;
          }

          try {
            const bytes = await downloadImage(pin.imageUrl, dest);
            downloaded++;
            usedPinIds.add(pin.id);
            photoLog.push({
              file: fileName,
              photo_id: pin.id,
              photographer: pin.pinner,
              photographer_url: pin.pinnerUrl,
              alt: pin.description,
              source_url: pin.imageUrl,
            });
            if (slot === 1) {
              console.log(
                `[pinterest]   first: ${(bytes / 1024).toFixed(0)}KB by ${pin.pinner}`,
              );
            }
            slot++;
          } catch (err) {
            failed++;
            console.warn(`[pinterest]   image ${slot} failed: ${(err as Error).message}`);
          }
        }

        if (downloaded > 0 && downloaded < args.per) {
          console.warn(`[pinterest]   only ${downloaded}/${args.per} for ${kw.slug}`);
        }

        index.entries = index.entries.filter(
          (e) => !(e.slug === kw.slug && e.provider === "pinterest"),
        );
        index.entries.push({
          slug: kw.slug,
          category: kw.category_slug,
          query,
          provider: "pinterest",
          photos: photoLog,
        });
      } catch (err) {
        console.error(`[pinterest] ${kw.slug} failed: ${(err as Error).message}`);
        failed++;
      }

      summary.push({ slug: kw.slug, downloaded, skipped: existing, failed });
      await sleep(REQUEST_DELAY_MS);
    }
  } finally {
    await scraper.close();
  }

  await mkdir(outRoot, { recursive: true });
  await writeFile(indexPath, JSON.stringify(index, null, 2));
  console.log(`[pinterest] index saved: ${indexPath}`);

  console.log("\n─── Summary ─────────────────────────");
  const totalDl = summary.reduce((s, r) => s + r.downloaded, 0);
  const totalSk = summary.reduce((s, r) => s + r.skipped, 0);
  const totalFa = summary.reduce((s, r) => s + r.failed, 0);
  console.log(`Keywords processed: ${summary.length}`);
  console.log(`Images downloaded:  ${totalDl}`);
  console.log(`Images skipped:     ${totalSk} (already present)`);
  console.log(`Failed:             ${totalFa}`);
  console.log(`Output: ${outRoot}`);
}

main().catch((err) => {
  console.error("[pinterest] fatal:", err);
  process.exit(1);
});
