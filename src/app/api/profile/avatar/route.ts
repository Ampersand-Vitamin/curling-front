import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  // Storage upload uses admin (service role) to bypass storage RLS
  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("Avatar upload error:", uploadError.message);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("avatars")
    .getPublicUrl(path);

  // DB update uses user client (RLS)
  const { error: dbError } = await supabase.rpc("update_avatar_url", {
    p_user_id:    user.id,
    p_avatar_url: publicUrl,
  });

  if (dbError) {
    console.error("update_avatar_url error:", dbError.message);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl });
}
