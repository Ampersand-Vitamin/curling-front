import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { EditProfileForm } from "./EditProfileForm";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { data: profile } = await supabaseAdmin
    .from("onboarding_profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return (
    <EditProfileForm
      profile={profile}
      email={session.user.email ?? ""}
      avatarUrl={(profile?.avatar_url as string | null) ?? session.user.image ?? null}
      sessionName={session.user.name ?? ""}
    />
  );
}
