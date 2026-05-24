import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { EditProfileForm } from "./EditProfileForm";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { data: rpcData } = await supabaseAdmin.rpc("get_hair_profile", {
    p_user_id: session.user.id,
  });
  const profile = Array.isArray(rpcData) ? (rpcData[0] ?? null) : (rpcData ?? null);

  return (
    <EditProfileForm
      profile={profile}
      email={session.user.email ?? ""}
      avatarUrl={(profile?.avatar_url as string | null) ?? session.user.image ?? null}
    />
  );
}
