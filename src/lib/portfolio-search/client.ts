// Supabase admin client (service_role). server-only.
//
// ⚠️ 이 파일은 절대 client component / 브라우저 번들에 들어가면 안 됨.
//   - service_role 은 RLS 우회 가능
//   - import 하는 모든 파일은 'use server' 또는 server-only 보장 필요
//
// 사용처:
//   - src/lib/portfolio-search/search.ts 에서 RPC 호출
//   - src/lib/portfolio-search/embed.ts 에서 (간접) 함께 사용
//
// anon key 만으로도 search_portfolios RPC 호출은 가능하지만, RLS 정책 도입 시
// 검색 성능에 영향을 주지 않게 admin 쪽으로 통일.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function ensureServer() {
  if (typeof window !== "undefined") {
    throw new Error(
      "[portfolio-search/client] admin client is server-only. Do not import from client components.",
    );
  }
}

let _admin: SupabaseClient | null = null;

export function getPortfolioAdminClient(): SupabaseClient {
  ensureServer();
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "[portfolio-search/client] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정",
    );
  }
  _admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
