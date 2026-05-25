"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { createClient } from "@/lib/supabase/client";

type PageProps = { params: Promise<{ conversationId: string }> };

type PartnerProfile = {
  name: string;
  salonName: string | null;
  avatarUrl: string | null;
  userId: string;
};

export default function ChatPage({ params }: PageProps) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState("");
  const [myId, setMyId] = useState("");
  const [myLang, setMyLang] = useState("ko");
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, loading, sendMessage } = useChat(conversationId, myLang);

  useEffect(() => {
    const init = async () => {
      const { conversationId: cid } = await params;
      setConversationId(cid);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }
      setMyId(user.id);

      const { data: profile } = await supabase
        .from("onboarding_profiles")
        .select("languages, account_mode")
        .eq("user_id", user.id)
        .maybeSingle();

      setMyLang((profile?.languages as string[])?.[0] ?? "ko");

      const { data: conv } = await supabase
        .from("conversation")
        .select("client_id, designer_id")
        .eq("id", cid)
        .maybeSingle();

      if (conv) {
        const partnerId = conv.client_id === user.id ? conv.designer_id : conv.client_id;
        const { data: p } = await supabase
          .from("onboarding_profiles")
          .select("name, salon_name, avatar_url, user_id")
          .eq("user_id", partnerId)
          .maybeSingle();

        if (p) {
          setPartner({
            name: (p.name as string) ?? "",
            salonName: (p.salon_name as string) ?? null,
            avatarUrl: (p.avatar_url as string) ?? null,
            userId: (p.user_id as string),
          });
        }
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string, isQuickReply = false) => {
    if (!conversationId) return;
    sendMessage(text, myLang, isQuickReply);
  };

  return (
    <div className="flex flex-col h-full bg-surface-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-50 border-b border-b-[0.5px] border-surface-300 pt-14 pb-2.5">
        <div className="flex items-center justify-between pl-4 pr-3">
          <div className="flex items-center gap-2.5">
            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center size-6"
            >
              <img src="/icons/chevron-left.svg" alt="back" width={16} height={16} />
            </button>

            {/* Partner avatar */}
            <div className="size-8 rounded-full overflow-hidden bg-surface-300 text-surface-500 flex items-center justify-center shrink-0">
              {partner?.avatarUrl ? (
                <img src={partner.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="9" r="4" />
                  <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
                </svg>
              )}
            </div>

            {/* Name + salon */}
            <div className="flex flex-col">
              <p className="typo-h6 text-surface-950">{partner?.name || "채팅"}</p>
              {partner?.salonName && (
                <p className="typo-caption2 text-surface-600">{partner.salonName}</p>
              )}
            </div>
          </div>

          {/* More icon */}
          <button className="flex items-center justify-center size-10 p-2.5">
            <img src="/icons/more.svg" alt="more" width={24} height={24} />
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4 scrollbar-hide">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" className="animate-spin text-surface-400">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" opacity="0.25" />
              <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="typo-body2 text-surface-400">첫 메시지를 보내보세요.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender_id === myId}
              myLang={myLang}
              partnerAvatarUrl={partner?.avatarUrl}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        designerId={partner?.userId}
      />
    </div>
  );
}
