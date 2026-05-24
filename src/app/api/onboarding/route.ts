import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const payload: Record<string, unknown> = {
    user_id:          user.id,
    account_mode:     body.accountMode   ?? null,
    name:             body.name          ?? "",
    gender:           body.gender        ?? "",
    hair_type:        body.hairType      ?? "",
    hair_length:      body.hairLength    ?? "",
    hair_concerns:    body.hairConcerns  ?? [],
    hair_history:     body.hairHistory   ?? [],
    languages:        body.languages     ?? [],
    preferred_styles: body.preferredStyles ?? [],
    updated_at:       new Date().toISOString(),
  };

  // bio/age/hair_color: null이면 기존 값 보존 (온보딩 흐름), 값이 있으면 덮어씀
  if (body.bio       != null) payload.bio        = body.bio;
  if (body.age       != null) payload.age        = body.age;
  if (body.hairColor != null) payload.hair_color = body.hairColor;

  const { error } = await supabase
    .from("hair_profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("upsert hair_profile error:", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("hair_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: profile ?? null });
}
