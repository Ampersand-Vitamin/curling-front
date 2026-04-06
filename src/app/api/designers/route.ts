import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * GET /api/designers
 * 디자이너 목록 반환
 */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("designers")
    .select("id, name, profile_image, bio, role, languages")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ designers: data });
}
