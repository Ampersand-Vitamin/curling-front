import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { error } = await supabase
    .from("onboarding_profiles")
    .upsert({
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
      bio:              body.bio        ?? null,
      age:              body.age        ?? null,
      hair_color:       body.hairColor  ?? null,
      updated_at:       new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    console.error("upsert onboarding_profiles error:", error.message, error.code);
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

  const { data, error } = await supabase
    .from("onboarding_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
