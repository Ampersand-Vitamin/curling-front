import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const { data } = await supabaseAdmin
    .from("onboarding_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (data) {
    redirect("/discover");
  } else {
    redirect("/onboarding/account-mode");
  }
}
