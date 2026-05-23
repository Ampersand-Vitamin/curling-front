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
    .from("hair_profiles")
    .upsert(
      {
        user_id: session.user.id,
        account_mode:     body.accountMode,
        name:             body.name,
        gender:           body.gender,
        hair_type:        body.hairType,
        hair_length:      body.hairLength,
        hair_concerns:    body.hairConcerns,    // string[]
        hair_history:     body.hairHistory,     // string[]
        languages:        body.languages,       // string[]
        preferred_styles: body.preferredStyles, // string[]
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("hair_profiles upsert error:", error);
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
    .from("hair_profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  // PGRST116 = row not found (온보딩 미완료)
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data ?? null });
}
