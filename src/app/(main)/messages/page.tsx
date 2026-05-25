export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getConversations } from "@/lib/messages";
import MessagesClient from "./MessagesClient";
import type { ConversationItem } from "@/types/message";

export type SuggestedDesigner = {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
  salonName: string | null;
};

async function getSuggestedDesigners(
  userId: string,
  existingDesignerIds: string[],
): Promise<SuggestedDesigner[]> {
  const supabase = await createClient();

  let query = supabase
    .from("designer_profile")
    .select("id, display_name, profile_image_url, salon:salon_id ( name )")
    .limit(3);

  if (existingDesignerIds.length > 0) {
    query = query.not("id", "in", `(${existingDesignerIds.join(",")})`);
  }

  const { data } = await query;

  return (data ?? []).map((d) => {
    const salon = d.salon as unknown as { name: string } | null;
    return {
      id: d.id,
      displayName: d.display_name,
      profileImageUrl: d.profile_image_url,
      salonName: salon?.name ?? null,
    };
  });
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  let conversations: ConversationItem[];
  try {
    conversations = await getConversations(user.id);
  } catch (err) {
    console.warn("[MessagesPage] conversation fetch failed", err);
    conversations = [];
  }

  const existingDesignerIds = conversations.map((c) => c.designerId);
  let suggestedDesigners: SuggestedDesigner[] = [];
  try {
    suggestedDesigners = await getSuggestedDesigners(user.id, existingDesignerIds);
  } catch {
    // silently fail — suggestions are non-critical
  }

  return (
    <MessagesClient
      conversations={conversations}
      suggestedDesigners={suggestedDesigners}
    />
  );
}
