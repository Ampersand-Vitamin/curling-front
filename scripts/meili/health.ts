// Meilisearch 컨테이너 + 인덱스 상태 점검.
// 사용:  pnpm meili:health

import { getMeiliAdminClient } from "../../src/lib/meili/client";
import { DESIGNERS_INDEX, EMBEDDER_NAME } from "../../src/lib/meili/types";

async function main() {
  const client = getMeiliAdminClient();

  const health = await client.health();
  console.log("[health] meilisearch:", health);

  const version = await client.getVersion();
  console.log("[health] version:", version);

  try {
    const stats = await client.index(DESIGNERS_INDEX).getStats();
    console.log(`[health] index "${DESIGNERS_INDEX}":`, {
      numberOfDocuments: stats.numberOfDocuments,
      isIndexing: stats.isIndexing,
    });
    const settings = await client.index(DESIGNERS_INDEX).getSettings();
    const embedders = settings.embedders ?? {};
    console.log(
      `[health] embedders:`,
      Object.keys(embedders).length === 0
        ? "(none)"
        : Object.keys(embedders).join(", "),
    );
    if (!(EMBEDDER_NAME in embedders)) {
      console.warn(
        `[health] WARN — embedder "${EMBEDDER_NAME}" 미등록. pnpm meili:setup 실행 필요.`,
      );
    }
  } catch (err) {
    console.warn(
      `[health] index "${DESIGNERS_INDEX}" 미존재 또는 조회 실패:`,
      err instanceof Error ? err.message : err,
    );
  }
}

main().catch((err) => {
  console.error("[health] failed:", err);
  process.exit(1);
});
