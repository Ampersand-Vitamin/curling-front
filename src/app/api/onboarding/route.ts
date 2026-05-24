import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { error } = await supabaseAdmin.rpc("upsert_hair_profile", {
    p_user_id:          session.user.id,
    p_account_mode:     body.accountMode,
    p_name:             body.name,
    p_gender:           body.gender,
    p_hair_type:        body.hairType,
    p_hair_length:      body.hairLength,
    p_hair_concerns:    body.hairConcerns,
    p_hair_history:     body.hairHistory,
    p_languages:        body.languages,
    p_preferred_styles: body.preferredStyles,
    // profile-only fields (undefined when not sent → Postgres DEFAULT NULL → preserves existing)
    ...(body.bio        !== undefined && { p_bio:        body.bio }),
    ...(body.age        !== undefined && { p_age:        body.age }),
    ...(body.hairColor  !== undefined && { p_hair_color: body.hairColor }),
  });

  if (error) {
    console.error("upsert_hair_profile rpc error:", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.rpc("get_hair_profile", {
    p_user_id: session.user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profile = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
  return NextResponse.json({ profile });
}
