// Meilisearch `designers` 인덱스 + settings 적용 (idempotent).
//
// 사용:  pnpm meili:setup
// 사전:  pnpm meili:up && .env.local 에 MEILI_HOST / MEILI_MASTER_KEY / OPENAI_API_KEY 채워둘 것

import { getMeiliAdminClient } from "../../src/lib/meili/client";
import { DESIGNERS_INDEX, PRIMARY_KEY } from "../../src/lib/meili/types";
import { designersSettings } from "../../src/lib/meili/schema";

const SETTINGS_TIMEOUT_MS = 5 * 60_000;

async function main() {
  const client = getMeiliAdminClient();

  // 1. 인덱스 생성 (이미 있으면 그대로)
  console.log(`[setup] ensuring index "${DESIGNERS_INDEX}" (primaryKey=${PRIMARY_KEY}) ...`);
  try {
    await client.createIndex(DESIGNERS_INDEX, { primaryKey: PRIMARY_KEY })
      .waitTask({ timeout: 60_000 });
    console.log("[setup] index created");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("index_already_exists") || msg.includes("already exists")) {
      console.log("[setup] index already exists — reusing");
    } else {
      throw err;
    }
  }

  // 2. settings 적용
  console.log("[setup] applying settings (searchable / filterable / embedders) ...");
  const settings = designersSettings();
  await client.index(DESIGNERS_INDEX).updateSettings(settings)
    .waitTask({ timeout: SETTINGS_TIMEOUT_MS });

  // 3. 검증
  const stats = await client.index(DESIGNERS_INDEX).getStats();
  console.log("[setup] done. stats:", {
    numberOfDocuments: stats.numberOfDocuments,
    isIndexing: stats.isIndexing,
  });
  console.log("[setup] embedder registered:", Object.keys(settings.embedders));
}

main().catch((err) => {
  console.error("[setup] failed:", err);
  process.exit(1);
});
