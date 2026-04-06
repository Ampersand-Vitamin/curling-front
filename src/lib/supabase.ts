import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** 브라우저용 Supabase 클라이언트 (anon key, RLS 적용) */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
