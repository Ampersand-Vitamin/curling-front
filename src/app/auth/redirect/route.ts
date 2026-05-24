import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data } = await supabase.rpc("get_hair_profile", {
    p_user_id: user.id,
  });

  const profile = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
  if (profile) {
    redirect("/discover");
  } else {
    redirect("/onboarding/account-mode");
  }
}
