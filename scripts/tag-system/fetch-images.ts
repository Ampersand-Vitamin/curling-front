/**
 * 헤어 이미지 수집 스크립트
 *
 * Pexels API를 사용하여 무료 라이선스 헤어 이미지를 다운로드합니다.
 * (Pexels는 API 키만 있으면 무료, 상업적 사용 가능)
 *
 * 사용법:
 *   PEXELS_API_KEY=xxx npx tsx scripts/tag-system/fetch-images.ts
 */

import "dotenv/config";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const API_KEY = process.env.PEXELS_API_KEY;
const OUTPUT_DIR = path.resolve("sample-data/images");
const MANIFEST_PATH = path.resolve("sample-data/image-manifest.json");

// 다양한 헤어 스타일을 커버하는 검색 쿼리
const SEARCH_QUERIES = [
  "short haircut woman",
  "long layered hair",
  "bob haircut",
  "men haircut style",
  "curly hair style",
  "blonde hair woman",
  "dark brown hair style",
  "ash hair color",
  "wavy hair woman",
  "pixie cut",
];

const IMAGES_PER_QUERY = 3; // 쿼리당 3장 × 10쿼리 = 30장

interface PexelsPhoto {
  id: number;
  photographer: string;
  src: { medium: string; original: string };
  alt: string;
  url: string;
}

interface ManifestEntry {
  id: string;
  filename: string;
  query: string;
  photographer: string;
  sourceUrl: string;
  alt: string;
}

async function searchPexels(
  query: string,
  perPage: number
): Promise<PexelsPhoto[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`;

  const res = await fetch(url, {
    headers: { Authorization: API_KEY! },
  });

  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.photos;
}

async function downloadImage(
  imageUrl: string,
  filepath: string
): Promise<void> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to download: ${imageUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(filepath, buffer);
}

async function main() {
  if (!API_KEY) {
    console.error("PEXELS_API_KEY 환경변수를 설정해주세요.");
    console.error(
      "  1. https://www.pexels.com/api/ 에서 무료 API 키 발급"
    );
    console.error(
      "  2. PEXELS_API_KEY=xxx npx tsx scripts/tag-system/fetch-images.ts"
    );
    process.exit(1);
  }

  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  const manifest: ManifestEntry[] = [];
  let downloadCount = 0;

  for (const query of SEARCH_QUERIES) {
    console.log(`\n🔍 검색: "${query}"`);

    try {
      const photos = await searchPexels(query, IMAGES_PER_QUERY);

      for (const photo of photos) {
        const filename = `hair-${String(downloadCount + 1).padStart(3, "0")}.jpg`;
        const filepath = path.join(OUTPUT_DIR, filename);

        console.log(`  📥 ${filename} — ${photo.alt || query}`);
        await downloadImage(photo.src.medium, filepath);

        manifest.push({
          id: `hair-${String(downloadCount + 1).padStart(3, "0")}`,
          filename,
          query,
          photographer: photo.photographer,
          sourceUrl: photo.url,
          alt: photo.alt || "",
        });

        downloadCount++;
      }
    } catch (err) {
      console.error(`  ❌ "${query}" 검색 실패:`, err);
    }

    // API rate limit 방지
    await new Promise((r) => setTimeout(r, 500));
  }

  // 매니페스트 저장
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(`\n✅ 완료: ${downloadCount}장 다운로드`);
  console.log(`📄 매니페스트: ${MANIFEST_PATH}`);
}

main();
