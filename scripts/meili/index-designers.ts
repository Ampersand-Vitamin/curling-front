// Supabase → Meilisearch 풀 인덱싱.
//
// 사용:  pnpm meili:index
// 사전:  pnpm meili:up && pnpm meili:setup
//
// 첫 실행은 OpenAI auto-embedding 호출이 발생하므로 분 단위 소요 가능.
// batch 별로 waitForTask 직렬화 → 429 회피.

import { getMeiliAdminClient } from "../../src/lib/meili/client";
import { DESIGNERS_INDEX, PRIMARY_KEY } from "../../src/lib/meili/types";
import {
  fetchDesignersForIndex,
  makeSupabaseAdminClient,
  rowToDoc,
} from "../../src/lib/meili/documents";

const BATCH_SIZE = 50;
const TASK_TIMEOUT_MS = 5 * 60_000;

async function main() {
  const t0 = Date.now();
  const meili = getMeiliAdminClient();
  const supabase = makeSupabaseAdminClient();

  console.log("[index] fetching designers from Supabase ...");
  const rows = await fetchDesignersForIndex(supabase);
  console.log(`[index] fetched ${rows.length} rows`);

  if (rows.length === 0) {
    console.warn("[index] no rows — nothing to index");
    return;
  }

  const docs = rows.map(rowToDoc);

  // 매핑 sanity check
  const sample = docs[0];
  console.log("[index] sample doc:", {
    id: sample.id,
    displayName: sample.displayName,
    keywordCount: sample.keywordSlugs.length,
    languages: sample.languages,
    salonName: sample.salonName,
    coverImageUrl: sample.coverImageUrl,
  });

  const index = meili.index(DESIGNERS_INDEX);

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    const task = await index.addDocuments(batch, { primaryKey: PRIMARY_KEY });
    const finished = await meili.waitForTask(task.taskUid, {
      timeOutMs: TASK_TIMEOUT_MS,
    });
    if (finished.status !== "succeeded") {
      console.error("[index] batch failed:", finished);
      process.exit(1);
    }
    console.log(
      `[index] batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
        docs.length / BATCH_SIZE,
      )} — added ${batch.length} (cumulative ${Math.min(i + BATCH_SIZE, docs.length)}/${docs.length})`,
    );
  }

  // 검증
  const stats = await index.getStats();
  console.log("[index] done. stats:", {
    numberOfDocuments: stats.numberOfDocuments,
    isIndexing: stats.isIndexing,
  });

  const elapsed = Math.round((Date.now() - t0) / 1000);
  console.log(`[index] elapsed: ${elapsed}s`);
}

main().catch((err) => {
  console.error("[index] failed:", err);
  process.exit(1);
});
