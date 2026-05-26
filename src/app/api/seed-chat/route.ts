/**
 * DEV-ONLY: 현재 로그인 유저 + 시드 디자이너로 대화 & 메시지를 생성한다.
 * GET /api/seed-chat
 *
 * 1) designer_profile 중 첫 번째를 골라 user_id를 가짜 Auth 유저로 연결
 * 2) conversation 생성 (client = 현재 유저, designer = 위 디자이너)
 * 3) 샘플 메시지 삽입
 * 4) 생성된 conversation id 반환 → /messages/:id 로 이동하면 됨
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  // 1) 현재 로그인 유저 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2) 시드 디자이너 1명 가져오기
  const { data: designer } = await supabaseAdmin
    .from("designer_profile")
    .select("id, display_name, user_id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!designer) {
    return NextResponse.json(
      { error: "No designer_profile found. Run seed first." },
      { status: 404 },
    );
  }

  // 3) 디자이너에 fake Auth 유저 연결 (아직 없으면)
  let designerAuthId = designer.user_id;

  if (!designerAuthId) {
    // 테스트용 Auth 유저 생성
    const email = `designer-${designer.id.slice(0, 8)}@test.curling.dev`;
    const { data: authUser, error: authErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: "test1234!",
        email_confirm: true,
        user_metadata: { display_name: designer.display_name, role: "designer" },
      });

    if (authErr && !authErr.message.includes("already been registered")) {
      return NextResponse.json({ error: authErr.message }, { status: 500 });
    }

    // 이미 있으면 email로 조회
    if (authErr) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const found = list?.users?.find((u) => u.email === email);
      designerAuthId = found?.id ?? null;
    } else {
      designerAuthId = authUser.user.id;
    }

    // designer_profile.user_id 업데이트
    if (designerAuthId) {
      await supabaseAdmin
        .from("designer_profile")
        .update({ user_id: designerAuthId })
        .eq("id", designer.id);
    }
  }

  // 4) 대화방 get-or-create (admin으로 직접)
  const { data: existingConv } = await supabaseAdmin
    .from("conversation")
    .select("id")
    .eq("client_id", user.id)
    .eq("designer_id", designer.id)
    .maybeSingle();

  let convId: string;

  if (existingConv) {
    convId = existingConv.id;
  } else {
    const { data: newConv, error: convErr } = await supabaseAdmin
      .from("conversation")
      .insert({ client_id: user.id, designer_id: designer.id })
      .select("id")
      .single();

    if (convErr || !newConv) {
      return NextResponse.json(
        { error: convErr?.message ?? "Failed to create conversation" },
        { status: 500 },
      );
    }
    convId = newConv.id;
  }

  // 5) 샘플 메시지 (이미 있으면 스킵)
  const { count } = await supabaseAdmin
    .from("message")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", convId);

  if (!count || count === 0) {
    const now = new Date();
    const msgs = [
      {
        conversation_id: convId,
        sender_id: user.id,
        content: "Hi! I'm looking for a curly hair specialist. Do you have experience with 3B curls?",
        created_at: new Date(now.getTime() - 60_000 * 4).toISOString(),
      },
      {
        conversation_id: convId,
        sender_id: designerAuthId!,
        content: "Absolutely! I specialize in curly and coily hair. 3B curls are one of my favorites to work with. Would you like to book a consultation?",
        created_at: new Date(now.getTime() - 60_000 * 3).toISOString(),
      },
    ];

    await supabaseAdmin.from("message").insert(msgs);

    // last_message_at 갱신
    await supabaseAdmin
      .from("conversation")
      .update({ last_message_at: msgs[msgs.length - 1].created_at })
      .eq("id", convId);
  }

  return NextResponse.json({
    conversationId: convId,
    designerName: designer.display_name,
    chatUrl: `/messages/${convId}`,
    message: "Seed complete! Navigate to chatUrl to test.",
  });
}
