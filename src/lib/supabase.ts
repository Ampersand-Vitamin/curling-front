import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// 클라이언트 사이드용 (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버 사이드용 (service role — RLS 우회). 클라이언트 번들에 포함될 경우 anon key로 fallback
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
