// Meilisearch 클라이언트 팩토리.
//
// ⚠️ server-only:
//   - admin client 는 master key 노출이라 절대 client bundle 에 포함되면 안 됨.
//   - 'server-only' 패키지가 없으므로 import 시 환경 가드만 둠.
//   - Server Action / Server Component / scripts/ 안에서만 import.

import { Meilisearch } from "meilisearch";

function ensureServer() {
  if (typeof window !== "undefined") {
    throw new Error(
      "[meili/client] meilisearch client is server-only. Do not import from client components.",
    );
  }
}

function readEnv(name: string, hint?: string): string {
  const v = process.env[name];
  if (!v) {
    const tail = hint ? ` (${hint})` : "";
    throw new Error(`[meili/client] ${name} not set${tail}.`);
  }
  return v;
}

let _admin: Meilisearch | null = null;

/** master key 사용 — 인덱싱/세팅 변경/검색 전부 가능. server only. */
export function getMeiliAdminClient(): Meilisearch {
  ensureServer();
  if (_admin) return _admin;
  _admin = new Meilisearch({
    host: readEnv("MEILI_HOST", "예: http://localhost:7700"),
    apiKey: readEnv("MEILI_MASTER_KEY", "Docker compose 의 MEILI_MASTER_KEY 와 동일"),
  });
  return _admin;
}

/** 향후 search-only key 전환 시 분기점. 현재는 admin 과 동일 인스턴스 반환. */
export function getMeilisearchClient(): Meilisearch {
  return getMeiliAdminClient();
}
