import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    accountMode,
    name,
    gender,
    hairType,
    hairLength,
    hairConcerns,
    hairHistory,
    languages,
    preferredStyles,
  } = body;

  const { error } = await supabaseAdmin
    .from("onboarding_profiles")
    .upsert(
      {
        user_id: session.user.id,
        account_mode: accountMode,
        name,
        gender,
        hair_type: hairType,
        hair_length: hairLength,
        hair_concerns: hairConcerns,
        hair_history: hairHistory,
        languages,
        preferred_styles: preferredStyles,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Onboarding save error:", error);
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
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data ?? null });
}
