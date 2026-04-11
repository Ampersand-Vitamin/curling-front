/**
 * 단일 이미지 업로드 → 태깅 → 매칭 테스트
 *
 * 사용법:
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/tag-system/test-match.ts <이미지 경로>
 *
 * 예시:
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/tag-system/test-match.ts ~/Desktop/my-hair.jpg
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/tag-system/test-match.ts sample-data/images/hair-005.jpg
 */

import "dotenv/config";
import { readFile } from "fs/promises";
import path from "path";
import { TAXONOMY, buildTagPromptSection } from "./kr-taxonomy";
import { rankMatches, type TagSet } from "./match";

const TAGGED_PATH = path.resolve("sample-data/tagged-results.json");

// ── 이미지 → 태그 추출 ─────────────────────────────────────

async function tagImage(
  imagePath: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY 환경변수를 설정해주세요.");
    process.exit(1);
  }

  const buffer = await readFile(imagePath);
  const base64 = buffer.toString("base64");
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";

  const prompt = `당신은 헤어스타일 분석 전문가입니다.
주어진 헤어 이미지를 분석하고, 아래 카테고리에서 해당하는 태그를 선택해주세요.

## 태그 카테고리
${buildTagPromptSection()}

## 규칙
1. 반드시 위 목록에 있는 태그만 사용하세요.
2. [복수 선택 가능] 카테고리는 배열로, 아닌 것은 문자열 하나로 반환하세요.
3. 확실하지 않은 카테고리는 null로 반환하세요.
4. confidence는 0.0~1.0 사이 값으로, 전체 분석의 확신도를 나타냅니다.

## 응답 형식 (JSON만 반환, 다른 텍스트 없이)
{
  "length": "미디엄",
  "cut": ["레이어드"],
  "texture": "웨이브",
  "color": ["브라운"],
  "tone": "웜톤",
  "mood": ["캐주얼", "모던"],
  "gender": "여성",
  "confidence": 0.85
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: base64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`JSON 파싱 실패: ${text}`);
  return JSON.parse(jsonMatch[0]);
}

// ── 메인 ────────────────────────────────────────────────────

async function main() {
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.log("사용법: npx tsx scripts/tag-system/test-match.ts <이미지 경로>");
    console.log("");
    console.log("예시:");
    console.log("  npx tsx scripts/tag-system/test-match.ts ~/Desktop/my-hair.jpg");
    console.log("  npx tsx scripts/tag-system/test-match.ts sample-data/images/hair-005.jpg");
    process.exit(1);
  }

  const resolvedPath = path.resolve(imagePath);

  // 1. 태깅
  console.log(`\n📸 이미지: ${resolvedPath}`);
  console.log("🔍 태그 분석 중...\n");

  const tags = await tagImage(resolvedPath);

  console.log("── 추출된 태그 ────────────────────────\n");
  for (const cat of TAXONOMY) {
    const val = tags[cat.key];
    if (val == null) continue;
    const display = Array.isArray(val) ? val.join(", ") : val;
    const weightBar = "■".repeat(cat.weight) + "□".repeat(3 - cat.weight);
    const must = cat.mustMatch ? " [필수]" : "";
    console.log(`  ${weightBar} ${cat.label}: ${display}${must}`);
  }
  console.log(`\n  확신도: ${((tags.confidence as number) * 100).toFixed(0)}%`);

  // 2. 매칭
  let portfolioData: { id: string; filename: string; tags: TagSet }[];
  try {
    const raw = await readFile(TAGGED_PATH, "utf-8");
    portfolioData = JSON.parse(raw);
  } catch {
    console.error("\n⚠️  tagged-results.json이 없어서 매칭을 건너뜁니다.");
    console.error("   태그 추출만 완료했습니다.");
    return;
  }

  const portfolios = portfolioData
    .filter((p) => !p.tags.error) // 에러난 항목 제외
    .map((p) => ({ id: p.id, tags: p.tags }));

  console.log(`\n🔍 ${portfolios.length}명의 포트폴리오와 매칭...\n`);

  // 필수 매칭 모드
  const matches = rankMatches(tags as TagSet, portfolios, { topN: 5 });

  if (matches.length === 0) {
    console.log("── 필수 태그 매칭 결과: 없음 ──────────\n");
    console.log("  색상/톤이 일치하는 포트폴리오가 없습니다.");
    console.log("  '색상 무관' 모드로 재검색합니다...\n");

    const relaxed = rankMatches(tags as TagSet, portfolios, {
      topN: 5,
      ignoreMustMatch: true,
    });

    console.log("── 매칭 결과 (색상 무관) ───────────────\n");
    printMatches(relaxed);
  } else {
    console.log("── 매칭 결과 ──────────────────────────\n");
    printMatches(matches);
  }
}

function printMatches(matches: ReturnType<typeof rankMatches>) {
  if (matches.length === 0) {
    console.log("  매칭 결과 없음");
    return;
  }

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
    console.log(`  ${medal} ${m.designerId} — ${m.percentage}% 매칭`);
    for (const mt of m.matchedTags) {
      console.log(`      ${mt.category}: ${mt.tags.join(", ")}`);
    }
    console.log();
  }
}

main();
