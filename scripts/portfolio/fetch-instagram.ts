// Instagram 크롤러 — 해시태그 기반 포트폴리오 이미지 수집
//
// Instagram 에서 해시태그 검색으로 전문 헤어살롱 포트폴리오 이미지를 수집.
// 인증이 필요하므로 INSTAGRAM_SESSION_ID 환경변수 필수.
//
// 세션 ID 얻는 방법:
//   1. 브라우저에서 Instagram 로그인
//   2. 개발자 도구 (F12) → Application → Cookies → instagram.com
//   3. "sessionid" 값 복사
//   4. .env 에 INSTAGRAM_SESSION_ID=<값> 추가
//
// 사용:
//   pnpm portfolio:fetch-instagram                        # 기본
//   pnpm portfolio:fetch-instagram -- --limit=3           # smoke test
//   pnpm portfolio:fetch-instagram -- --per=5             # 키워드당 5장
//   pnpm portfolio:fetch-instagram -- --categories=style  # 특정 카테고리만
//
// 출력:
//   tmp/portfolio-images/<slug>/ig_01.jpg .. ig_10.jpg
//   tmp/portfolio-images/_index.json 에 provider: "instagram" 항목 추가
//
// 주의: Instagram ToS상 자동화 수집 금지. 시드 데이터용 소량만 사용할 것.

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
const REQUEST_DELAY_MS = 3000; // 3초 — Instagram rate limit 엄격
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const IG_APP_ID = "936619743392459";
const FILE_PREFIX = "ig_";

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
// Hashtag builder
// ─────────────────────────────────────────────────────────────

// keyword slug → Instagram 해시태그 (여러 개: 첫 번째로 검색, 없으면 다음)
const HASHTAG_MAP: Record<string, string[]> = {
  balayage:           ["balayage", "balayagehair"],
  highlights:         ["hairhighlights", "highlights"],
  ombre:              ["ombrehair", "ombre"],
  color_correction:   ["colorcorrection", "haircolorcorrection"],
  keratin:            ["keratintreatment", "keratin"],
  digital_perm:       ["digitalperm"],
  bob_cut:            ["bobhaircut", "bobcut"],
  layers:             ["layeredhaircut", "layeredcut"],
  pixie:              ["pixiecut", "pixiehair"],
  curtain_bangs:      ["curtainbangs"],
  wolf_cut:           ["wolfcut", "wolfcuthair"],
  shag:               ["shaghaircut"],
  locs:               ["locs", "locstyles"],
  braids:             ["braids", "braidstyles"],
  big_chop:           ["bigchop", "bigchoptransformation"],
  head_spa:           ["headspa", "headspaasmr"],
  blonde:             ["blondehair", "blonde"],
  brunette:           ["brunettehair", "brunette"],
  red_hair:           ["redhair", "gingerhair"],
  platinum:           ["platinumblonde", "platinumhair"],
  straight:           ["straighthair", "hairstraightening"],
  wavy:               ["wavyhair", "beachwaves"],
  curly_hair_3a_3c:   ["curlyhair", "curls"],
  coily_hair_4a_4c:   ["coilyhair", "naturalhaircommunity"],
  afro_textured_hair: ["afrohair", "naturalhair"],
  mixed_texture_hair: ["mixedtexture", "multitextured"],
  taper:              ["taperfade", "taper"],
  undercut:           ["undercut", "undercuthairstyle"],
};

function buildHashtags(slug: string): string[] {
  if (HASHTAG_MAP[slug]) return HASHTAG_MAP[slug];
  const tag = slug.replace(/_/g, "");
  return [tag, `${tag}hair`];
}

// ─────────────────────────────────────────────────────────────
// Instagram scraper
// ─────────────────────────────────────────────────────────────

type IGMedia = {
  id: string;
  imageUrl: string;
  caption: string | null;
  username: string;
};

class InstagramScraper {
  private sessionId: string;
  private csrfToken = "";
  private cookies = "";

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /** CSRF 토큰 획득 + 세션 검증 */
  async init(): Promise<void> {
    const res = await fetch("https://www.instagram.com/", {
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: `sessionid=${this.sessionId}`,
      },
      redirect: "follow",
    });

    // Set-Cookie 에서 csrftoken 추출
    const setCookies = res.headers.getSetCookie?.() ?? [];
    const allCookies = setCookies.map((c) => c.split(";")[0]).join("; ");

    const csrfMatch = allCookies.match(/csrftoken=([^;]+)/);
    if (csrfMatch) {
      this.csrfToken = csrfMatch[1];
    } else {
      // HTML body 에서 추출 시도
      const html = await res.text();
      const htmlMatch = html.match(/"csrf_token":"([^"]+)"/);
      this.csrfToken = htmlMatch?.[1] ?? "";
    }

    this.cookies = [
      `sessionid=${this.sessionId}`,
      `csrftoken=${this.csrfToken}`,
      allCookies,
    ]
      .filter(Boolean)
      .join("; ");

    if (!this.csrfToken) {
      throw new Error(
        "CSRF token 획득 실패. INSTAGRAM_SESSION_ID 가 만료되었을 수 있습니다.",
      );
    }
  }

  /** 해시태그 피드에서 이미지 검색 */
  async searchHashtag(tag: string, count: number): Promise<IGMedia[]> {
    const res = await fetch(
      `https://www.instagram.com/api/v1/tags/${encodeURIComponent(tag)}/sections/`,
      {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          Cookie: this.cookies,
          "X-CSRFToken": this.csrfToken,
          "X-IG-App-ID": IG_APP_ID,
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: `https://www.instagram.com/explore/tags/${tag}/`,
          Origin: "https://www.instagram.com",
        },
        body: new URLSearchParams({ tab: "recent" }),
      },
    );

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Instagram ${res.status} — 세션 만료. .env 의 INSTAGRAM_SESSION_ID 를 갱신하세요.`,
      );
    }
    if (res.status === 429) {
      throw new Error("Instagram rate limit 도달. 잠시 후 다시 시도하세요.");
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Instagram ${res.status}: ${text.slice(0, 200) || res.statusText}`);
    }

    const json = (await res.json()) as Record<string, unknown>;
    return this.extractMedia(json, count);
  }

  private extractMedia(data: Record<string, unknown>, limit: number): IGMedia[] {
    const results: IGMedia[] = [];

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const sections = (data as any)?.sections ?? [];

    for (const section of sections) {
      const medias: any[] = section?.layout_content?.medias ?? [];
      for (const item of medias) {
        const node = item?.media;
        if (!node) continue;

        // media_type: 1=photo, 2=video, 8=carousel
        if (node.media_type === 2) continue; // 동영상 스킵

        let imageUrl: string | undefined;
        if (node.media_type === 8 && node.carousel_media?.length) {
          // 캐러셀: 첫 번째 이미지
          imageUrl = node.carousel_media[0]?.image_versions2?.candidates?.[0]?.url;
        } else {
          imageUrl = node.image_versions2?.candidates?.[0]?.url;
        }
        if (!imageUrl) continue;

        results.push({
          id: node.code ?? String(node.pk),
          imageUrl,
          caption: node.caption?.text ?? null,
          username: node.user?.username ?? "unknown",
        });

        if (results.length >= limit) return results;
      }
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return results;
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
  if (!url || !key) throw new Error("[instagram] Supabase env missing");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("keyword")
    .select("id, slug, name, keyword_category!inner(slug)")
    .in("keyword_category.slug", categories);
  if (error) throw new Error(`[instagram/keyword] ${error.message}`);
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

  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  if (!sessionId) {
    console.error(
      "[instagram] INSTAGRAM_SESSION_ID 환경변수가 없습니다.\n" +
        "  1. 브라우저에서 Instagram 로그인\n" +
        '  2. 개발자도구 → Application → Cookies → "sessionid" 값 복사\n' +
        "  3. .env 에 INSTAGRAM_SESSION_ID=<값> 추가",
    );
    process.exit(1);
  }

  console.log(`[instagram] provider: instagram (session auth)`);
  console.log(`[instagram] categories: ${args.categories.join(", ")}`);
  console.log(`[instagram] per keyword: ${args.per}`);

  let keywords = await fetchKeywords(args.categories);
  console.log(`[instagram] ${keywords.length} keywords from DB`);

  if (args.limit) {
    keywords = keywords.slice(0, args.limit);
    console.log(`[instagram] limit → ${keywords.length} keywords`);
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

  // Instagram 전용 dedup
  const usedIds = new Set<string>(
    index.entries
      .filter((e) => e.provider === "instagram")
      .flatMap((e) => e.photos.map((p) => p.photo_id)),
  );

  const scraper = new InstagramScraper(sessionId);
  console.log("[instagram] initializing session...");
  await scraper.init();
  console.log("[instagram] session OK");

  const summary: Array<{
    slug: string;
    downloaded: number;
    skipped: number;
    failed: number;
  }> = [];

  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i];
    const hashtags = buildHashtags(kw.slug);
    const folder = join(outRoot, kw.slug);

    // 이미 다운로드된 파일 수 확인
    let existing = 0;
    for (let n = 1; n <= args.per; n++) {
      if (await fileExists(join(folder, `${FILE_PREFIX}${String(n).padStart(2, "0")}.jpg`)))
        existing++;
    }
    if (existing >= args.per) {
      console.log(
        `[instagram] [${i + 1}/${keywords.length}] ${kw.slug} — already ${existing}, skip`,
      );
      summary.push({ slug: kw.slug, downloaded: 0, skipped: existing, failed: 0 });
      continue;
    }

    console.log(
      `[instagram] [${i + 1}/${keywords.length}] ${kw.slug} ← #${hashtags.join(", #")}`,
    );

    let downloaded = 0;
    let failed = 0;
    const photoLog: IndexEntry["photos"] = [];
    let usedTag = hashtags[0];

    try {
      // 해시태그 순서대로 시도, 결과 나올 때까지
      let medias: IGMedia[] = [];
      for (const tag of hashtags) {
        try {
          medias = await scraper.searchHashtag(tag, args.per * 3);
          usedTag = tag;
          if (medias.length > 0) break;
        } catch (err) {
          console.warn(`[instagram]   #${tag} failed: ${(err as Error).message}`);
          await sleep(REQUEST_DELAY_MS);
        }
      }

      if (medias.length === 0) {
        console.warn(`[instagram]   no results for ${kw.slug}`);
        summary.push({ slug: kw.slug, downloaded: 0, skipped: existing, failed: 0 });
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      console.log(`[instagram]   ${medias.length} photos from #${usedTag}`);

      const unique = medias.filter((m) => !usedIds.has(m.id));
      let slot = 1;

      for (const media of unique) {
        if (slot > args.per) break;
        const fileName = `${FILE_PREFIX}${String(slot).padStart(2, "0")}.jpg`;
        const dest = join(folder, fileName);
        if (await fileExists(dest)) {
          slot++;
          continue;
        }

        try {
          const bytes = await downloadImage(media.imageUrl, dest);
          downloaded++;
          usedIds.add(media.id);
          photoLog.push({
            file: fileName,
            photo_id: media.id,
            photographer: media.username,
            photographer_url: `https://instagram.com/${media.username}`,
            alt: media.caption ? media.caption.slice(0, 200) : null,
            source_url: media.imageUrl,
          });
          if (slot === 1) {
            console.log(
              `[instagram]   first: ${(bytes / 1024).toFixed(0)}KB by @${media.username}`,
            );
          }
          slot++;
        } catch (err) {
          failed++;
          console.warn(`[instagram]   image ${slot} failed: ${(err as Error).message}`);
        }
      }

      if (downloaded > 0 && downloaded < args.per) {
        console.warn(`[instagram]   only ${downloaded}/${args.per} for ${kw.slug}`);
      }

      // Index 갱신
      index.entries = index.entries.filter(
        (e) => !(e.slug === kw.slug && e.provider === "instagram"),
      );
      index.entries.push({
        slug: kw.slug,
        category: kw.category_slug,
        query: `#${usedTag}`,
        provider: "instagram",
        photos: photoLog,
      });
    } catch (err) {
      console.error(`[instagram] ${kw.slug} failed: ${(err as Error).message}`);
      failed++;
    }

    summary.push({ slug: kw.slug, downloaded, skipped: existing, failed });
    await sleep(REQUEST_DELAY_MS);
  }

  await mkdir(outRoot, { recursive: true });
  await writeFile(indexPath, JSON.stringify(index, null, 2));
  console.log(`[instagram] index saved: ${indexPath}`);

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
  console.error("[instagram] fatal:", err);
  process.exit(1);
});
