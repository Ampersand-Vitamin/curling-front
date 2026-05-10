// 인덱스를 통째로 지우고 setup + index 를 재실행.
// 개발용 — 운영에서 절대 호출 금지.
//
// 사용:  pnpm meili:reset

import { getMeiliAdminClient } from "../../src/lib/meili/client";
import { DESIGNERS_INDEX } from "../../src/lib/meili/types";

async function main() {
  const client = getMeiliAdminClient();
  console.log(`[reset] deleting index "${DESIGNERS_INDEX}" ...`);
  try {
    const task = await client.deleteIndex(DESIGNERS_INDEX);
    await client.waitForTask(task.taskUid, { timeOutMs: 60_000 });
    console.log("[reset] deleted");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("index_not_found")) {
      console.log("[reset] index did not exist");
    } else {
      throw err;
    }
  }

  console.log("[reset] re-running setup + index ...");
  // dynamic import 로 module-level 부수효과 회피
  await import("./setup-index");
  // setup-index 가 main 을 즉시 실행하므로 await 후에는 거의 끝나있음.
  // index-designers 는 setup 완료 후 별도 cli 로 실행 권장 (대용량 임베딩 분리).
  console.log("[reset] setup done. Now run: pnpm meili:index");
}

main().catch((err) => {
  console.error("[reset] failed:", err);
  process.exit(1);
});
