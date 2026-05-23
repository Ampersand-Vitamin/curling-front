import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  // 온보딩 완료 여부 확인
  const { data } = await supabaseAdmin
    .from("hair_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .single();

  if (data) {
    redirect("/discover");
  } else {
    redirect("/onboarding/account-mode");
  }
}
