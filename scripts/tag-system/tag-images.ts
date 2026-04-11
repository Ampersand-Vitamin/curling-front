/**
 * Vision AI 자동 태깅 스크립트
 *
 * sample-data/images/ 의 이미지를 하나씩 Claude Vision에 보내
 * taxonomy.ts에 정의된 태그 체계로 자동 분류합니다.
 *
 * 사용법:
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/tag-system/tag-images.ts
 *
 * OpenAI를 쓰고 싶으면:
 *   OPENAI_API_KEY=xxx VISION_PROVIDER=openai npx tsx scripts/tag-system/tag-images.ts
 */

import "dotenv/config";
import { readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import { TAXONOMY, buildTagPromptSection } from "./kr-taxonomy";

const IMAGES_DIR = path.resolve("sample-data/images");
const OUTPUT_PATH = path.resolve("sample-data/tagged-results.json");

const VISION_PROVIDER = process.env.VISION_PROVIDER || "anthropic"; // "anthropic" | "openai"

// ── 태깅 프롬프트 ──────────────────────────────────────────

function buildPrompt(): string {
  return `당신은 헤어스타일 분석 전문가입니다.
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
}

// ── Claude Vision API ───────────────────────────────────────

async function tagWithClaude(
  imageBase64: string,
  mimeType: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 환경변수를 설정해주세요.");

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
              source: {
                type: "base64",
                media_type: mimeType,
                data: imageBase64,
              },
            },
            { type: "text", text: buildPrompt() },
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

  // JSON 파싱 (```json ... ``` 감싸기 대응)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`JSON 파싱 실패: ${text}`);
  return JSON.parse(jsonMatch[0]);
}

// ── OpenAI Vision API ───────────────────────────────────────

async function tagWithOpenAI(
  imageBase64: string,
  mimeType: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY 환경변수를 설정해주세요.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
            { type: "text", text: buildPrompt() },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const text = data.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`JSON 파싱 실패: ${text}`);
  return JSON.parse(jsonMatch[0]);
}

// ── 태그 검증 ───────────────────────────────────────────────

function validateTags(
  tags: Record<string, unknown>
): Record<string, unknown> {
  const validated: Record<string, unknown> = {};

  for (const cat of TAXONOMY) {
    const value = tags[cat.key];
    if (value === null || value === undefined) {
      validated[cat.key] = null;
      continue;
    }

    // 배열인 경우: 유효한 태그만 필터링
    if (Array.isArray(value)) {
      validated[cat.key] = value.filter((v) =>
        cat.tags.includes(v as string)
      );
    } else if (typeof value === "string") {
      validated[cat.key] = cat.tags.includes(value) ? value : null;
    }
  }

  validated.confidence = tags.confidence ?? 0;
  return validated;
}

// ── 메인 ────────────────────────────────────────────────────

interface TaggedImage {
  id: string;
  filename: string;
  tags: Record<string, unknown>;
}

async function main() {
  const tagFn =
    VISION_PROVIDER === "openai" ? tagWithOpenAI : tagWithClaude;
  const providerName = VISION_PROVIDER === "openai" ? "GPT-4o" : "Claude";

  console.log(`🏷️  Vision AI 자동 태깅 (${providerName})\n`);

  const files = (await readdir(IMAGES_DIR)).filter((f) =>
    /\.(jpg|jpeg|png|webp)$/i.test(f)
  );

  if (files.length === 0) {
    console.error("이미지가 없습니다. 먼저 fetch-images.ts를 실행해주세요.");
    process.exit(1);
  }

  console.log(`📁 ${files.length}장 발견\n`);

  const results: TaggedImage[] = [];

  for (const file of files) {
    const filepath = path.join(IMAGES_DIR, file);
    const buffer = await readFile(filepath);
    const base64 = buffer.toString("base64");
    const ext = path.extname(file).toLowerCase();
    const mimeType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

    const id = path.basename(file, ext);

    try {
      process.stdout.write(`  🔍 ${file} ... `);
      const rawTags = await tagFn(base64, mimeType);
      const validatedTags = validateTags(rawTags);

      results.push({ id, filename: file, tags: validatedTags });

      // 태그 요약 출력
      const summary = Object.entries(validatedTags)
        .filter(([k, v]) => k !== "confidence" && v !== null)
        .map(([, v]) => (Array.isArray(v) ? v.join("/") : v))
        .join(" · ");
      console.log(`✅ ${summary}`);
    } catch (err) {
      console.log(`❌ 실패 — ${err}`);
      results.push({ id, filename: file, tags: { error: String(err) } });
    }

    // API rate limit 방지
    await new Promise((r) => setTimeout(r, 1000));
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(results, null, 2));

  console.log(`\n✅ 완료: ${results.length}장 태깅`);
  console.log(`📄 결과: ${OUTPUT_PATH}`);
}

main();
