export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getConversations } from "@/lib/messages";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  let conversations;
  try {
    conversations = await getConversations(user.id);
  } catch (err) {
    console.warn("[MessagesPage] conversation fetch failed", err);
    conversations = [];
  }

  return <MessagesClient conversations={conversations} />;
}
