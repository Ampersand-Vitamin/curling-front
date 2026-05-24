import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const { data } = await supabaseAdmin.rpc("get_hair_profile", {
    p_user_id: session.user.id,
  });

  const profile = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
  if (profile) {
    redirect("/discover");
  } else {
    redirect("/onboarding/account-mode");
  }
}
