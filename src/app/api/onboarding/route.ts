import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { error } = await supabaseAdmin
    .from("onboarding_profiles")
    .upsert({
      user_id:          session.user.id,
      account_mode:     body.accountMode   ?? null,
      name:             body.name          ?? "",
      gender:           body.gender        ?? "",
      hair_type:        body.hairType      ?? "",
      hair_length:      body.hairLength    ?? "",
      hair_concerns:    body.hairConcerns  ?? [],
      hair_history:     body.hairHistory   ?? [],
      languages:        body.languages     ?? [],
      preferred_styles: body.preferredStyles ?? [],
      bio:              body.bio        ?? null,
      age:              body.age        ?? null,
      hair_color:       body.hairColor  ?? null,
      updated_at:       new Date().toISOString(),
    }, { onConflict: "user_id" });

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

  const { data, error } = await supabaseAdmin
    .from("onboarding_profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
