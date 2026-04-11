/**
 * 태그 기반 매칭 로직
 *
 * 업로드 이미지의 태그와 디자이너 포트폴리오 태그를 비교하여
 * 매칭 점수를 계산하고 정렬합니다.
 *
 * 사용법:
 *   npx tsx scripts/tag-system/match.ts
 *   (sample-data/tagged-results.json 필요)
 */

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { TAXONOMY, type TagCategory } from "./kr-taxonomy";

const TAGGED_PATH = path.resolve("sample-data/tagged-results.json");
const MATCH_OUTPUT = path.resolve("sample-data/match-demo.json");

// ── 매칭 점수 계산 ─────────────────────────────────────────

interface TagSet {
  [categoryKey: string]: string | string[] | null | number;
}

interface MatchResult {
  designerId: string;
  score: number;
  maxScore: number;
  percentage: number;
  matchedTags: { category: string; tags: string[] }[];
  mustMatchFailed: boolean;
}

/**
 * 두 태그셋의 카테고리 내 겹치는 태그 수를 구함
 */
function categoryOverlap(
  uploadValue: unknown,
  portfolioValue: unknown
): { matched: string[]; total: number } {
  if (uploadValue == null || portfolioValue == null) {
    return { matched: [], total: 0 };
  }

  const uploadArr = Array.isArray(uploadValue)
    ? uploadValue
    : [uploadValue];
  const portfolioArr = Array.isArray(portfolioValue)
    ? portfolioValue
    : [portfolioValue];

  const matched = uploadArr.filter((t) => portfolioArr.includes(t));
  return { matched, total: uploadArr.length };
}

/**
 * 가중치 기반 매칭 점수 계산
 *
 * 점수 = Σ(겹치는 태그 비율 × 카테고리 가중치) / Σ(카테고리 가중치)
 * mustMatch 카테고리가 불일치하면 후보에서 제외
 */
function calculateMatch(
  uploadTags: TagSet,
  portfolioTags: TagSet,
  options: { ignoreMustMatch?: boolean } = {}
): MatchResult {
  let weightedScore = 0;
  let totalWeight = 0;
  let mustMatchFailed = false;
  const matchedTags: MatchResult["matchedTags"] = [];

  for (const cat of TAXONOMY) {
    const uploadVal = uploadTags[cat.key];
    const portfolioVal = portfolioTags[cat.key];

    // 업로드에 해당 카테고리가 없으면 스킵 (가중치에서도 제외)
    if (uploadVal == null) continue;

    const { matched, total } = categoryOverlap(uploadVal, portfolioVal);
    const ratio = total > 0 ? matched.length / total : 0;

    // mustMatch 체크
    if (cat.mustMatch && !options.ignoreMustMatch && ratio === 0) {
      mustMatchFailed = true;
    }

    weightedScore += ratio * cat.weight;
    totalWeight += cat.weight;

    if (matched.length > 0) {
      matchedTags.push({ category: cat.label, tags: matched });
    }
  }

  const percentage =
    totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;

  return {
    designerId: "",
    score: weightedScore,
    maxScore: totalWeight,
    percentage: Math.round(percentage),
    matchedTags,
    mustMatchFailed,
  };
}

/**
 * 매칭 결과를 정렬하여 반환
 * mustMatch 실패한 항목은 제외 (옵션)
 */
function rankMatches(
  uploadTags: TagSet,
  portfolios: { id: string; tags: TagSet }[],
  options: { ignoreMustMatch?: boolean; topN?: number } = {}
): MatchResult[] {
  const results = portfolios.map((p) => {
    const result = calculateMatch(uploadTags, p.tags, options);
    result.designerId = p.id;
    return result;
  });

  return results
    .filter((r) => !r.mustMatchFailed)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, options.topN ?? 10);
}

// ── 데모 실행 ───────────────────────────────────────────────

async function main() {
  let taggedData: { id: string; filename: string; tags: TagSet }[];

  try {
    const raw = await readFile(TAGGED_PATH, "utf-8");
    taggedData = JSON.parse(raw);
  } catch {
    console.error("tagged-results.json이 없습니다.");
    console.error("먼저 tag-images.ts를 실행해주세요.");
    process.exit(1);
  }

  if (taggedData.length < 2) {
    console.error("최소 2개 이상의 태깅 데이터가 필요합니다.");
    process.exit(1);
  }

  // 데모: 첫 번째 이미지를 "업로드 이미지"로, 나머지를 "디자이너 포트폴리오"로 가정
  const uploadImage = taggedData[0];
  const portfolios = taggedData.slice(1);

  console.log("📤 업로드 이미지:", uploadImage.filename);
  console.log("   태그:", JSON.stringify(uploadImage.tags, null, 2));
  console.log(`\n🔍 ${portfolios.length}명의 디자이너 포트폴리오와 매칭...\n`);

  const matches = rankMatches(
    uploadImage.tags,
    portfolios.map((p) => ({ id: p.id, tags: p.tags })),
    { topN: 5 }
  );

  console.log("── 매칭 결과 ──────────────────────────\n");

  if (matches.length === 0) {
    console.log("매칭되는 디자이너가 없습니다 (필수 태그 불일치)");
    console.log("'색상 상관없음' 모드로 다시 시도...\n");

    const relaxedMatches = rankMatches(
      uploadImage.tags,
      portfolios.map((p) => ({ id: p.id, tags: p.tags })),
      { topN: 5, ignoreMustMatch: true }
    );

    for (const m of relaxedMatches) {
      console.log(`  🏆 ${m.designerId} — ${m.percentage}% 매칭`);
      for (const mt of m.matchedTags) {
        console.log(`     ${mt.category}: ${mt.tags.join(", ")}`);
      }
      console.log();
    }
  } else {
    for (const m of matches) {
      console.log(`  🏆 ${m.designerId} — ${m.percentage}% 매칭`);
      for (const mt of m.matchedTags) {
        console.log(`     ${mt.category}: ${mt.tags.join(", ")}`);
      }
      console.log();
    }
  }

  // 결과 저장
  const output = {
    uploadImage: { id: uploadImage.id, tags: uploadImage.tags },
    matches,
    timestamp: new Date().toISOString(),
  };
  await writeFile(MATCH_OUTPUT, JSON.stringify(output, null, 2));
  console.log(`📄 결과 저장: ${MATCH_OUTPUT}`);
}

main();

// 다른 스크립트에서 import 가능하도록 export
export { calculateMatch, rankMatches, type MatchResult, type TagSet };
