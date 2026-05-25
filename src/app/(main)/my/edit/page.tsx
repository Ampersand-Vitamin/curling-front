import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditProfileForm } from "./EditProfileForm";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("onboarding_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <EditProfileForm
      profile={profile}
      email={user.email ?? ""}
      avatarUrl={(profile?.avatar_url as string | null) ?? user.user_metadata?.avatar_url ?? null}
      sessionName={user.user_metadata?.full_name ?? ""}
    />
  );
}
