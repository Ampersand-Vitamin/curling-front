// Design Ref: §4.1, DS-6 — env 조기 검증으로 빌드/런타임 양쪽에서 조기 실패
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local",
  );
}

export const supabase = createClient(url, anonKey);
