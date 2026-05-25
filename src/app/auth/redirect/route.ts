import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data } = await supabase
    .from("onboarding_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data) {
    redirect("/discover");
  } else {
    redirect("/onboarding/account-mode");
  }
}
