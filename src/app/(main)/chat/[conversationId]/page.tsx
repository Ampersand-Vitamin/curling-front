"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { createClient } from "@/lib/supabase/client";

type PageProps = { params: Promise<{ conversationId: string }> };

function Sk({ className }: { className: string }) {
  return <div className={`bg-surface-200 animate-pulse rounded-2xl ${className}`} />;
}

function ChatSkeleton() {
  const rows: Array<{ mine: boolean; w: string }> = [
    { mine: false, w: "w-48" },
    { mine: true,  w: "w-36" },
    { mine: true,  w: "w-56" },
    { mine: false, w: "w-52" },
    { mine: false, w: "w-40" },
    { mine: true,  w: "w-44" },
    { mine: true,  w: "w-32" },
    { mine: false, w: "w-56" },
  ];
  return (
    <div className="flex flex-col gap-4 w-full">
      {rows.map((row, i) =>
        row.mine ? (
          <div key={i} className="flex items-end justify-end gap-2.5">
            <Sk className="w-10 h-3 rounded-full bg-surface-200" />
            <Sk className={`${row.w} h-11`} />
          </div>
        ) : (
          <div key={i} className="flex items-end gap-2.5">
            <div className="size-8 rounded-full bg-surface-200 animate-pulse shrink-0" />
            <Sk className={`${row.w} h-11`} />
            <Sk className="w-8 h-3 rounded-full bg-surface-200" />
          </div>
        )
      )}
    </div>
  );
}

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

            {/* Partner avatar + name — designer profile link */}
            {partner ? (
              <Link href={`/designer/${partner.userId}`} className="flex items-center gap-2.5">
                <div className="size-8 rounded-full overflow-hidden bg-surface-300 text-surface-500 flex items-center justify-center shrink-0">
                  {partner.avatarUrl ? (
                    <img src={partner.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="9" r="4" />
                      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="typo-h6 text-surface-950">{partner.name}</p>
                  {partner.salonName && (
                    <p className="typo-caption2 text-surface-600">{partner.salonName}</p>
                  )}
                </div>
              </Link>
            ) : (
              <>
                <div className="size-8 rounded-full bg-surface-200 animate-pulse shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <div className="w-24 h-3.5 rounded-full bg-surface-200 animate-pulse" />
                  <div className="w-16 h-2.5 rounded-full bg-surface-200 animate-pulse" />
                </div>
              </>
            )}
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
          <ChatSkeleton />
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
