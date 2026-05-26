export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getConversationDetail, getMessages } from "@/lib/messages";
import ChatRoomClient from "./ChatRoomClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ChatRoomPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [conversation, messages] = await Promise.all([
    getConversationDetail(id),
    getMessages(id),
  ]);

  if (!conversation) redirect("/messages");

  return (
    <ChatRoomClient
      conversation={conversation}
      initialMessages={messages}
      currentUserId={user.id}
    />
  );
}
