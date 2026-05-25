"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageInput } from "@/components/chat/MessageInput";

const DEFAULT_QUICK_REPLIES = ["See Availability", "Service Options", "Booking Request"];

type QuickReply = {
  id: string;
  type: string;
  content: Record<string, string>;
  sort_order: number;
};

export default function NewChatPage() {
  const router = useRouter();
  const params = useParams();
  const designerId = params.designerId as string;

  const [myId, setMyId] = useState("");
  const [myLang, setMyLang] = useState("en");
  const [designerName, setDesignerName] = useState("");
  const [designerSalon, setDesignerSalon] = useState("");
  const [designerAvatar, setDesignerAvatar] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>(DEFAULT_QUICK_REPLIES);
  const [sending, setSending] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }
      setMyId(user.id);

      // Redirect if conversation already exists
      const { data: existing } = await supabase
        .from("conversation")
        .select("id")
        .eq("client_id", user.id)
        .eq("designer_id", designerId)
        .maybeSingle();
      if (existing) { router.replace(`/chat/${existing.id}`); return; }

      // My language
      const { data: myProfile } = await supabase
        .from("onboarding_profiles")
        .select("languages")
        .eq("user_id", user.id)
        .maybeSingle();
      setMyLang((myProfile?.languages as string[])?.[0] ?? "en");

      // Designer profile
      const { data: dp } = await supabase
        .from("onboarding_profiles")
        .select("name, salon_name, avatar_url")
        .eq("user_id", designerId)
        .maybeSingle();
      if (dp) {
        setDesignerName((dp.name as string) ?? "");
        setDesignerSalon((dp.salon_name as string) ?? "");
        setDesignerAvatar((dp.avatar_url as string) ?? null);
      }

      // Quick replies
      const { data: qr } = await supabase
        .from("quick_reply")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .limit(3);
      if (qr && qr.length > 0) {
        const texts = (qr as QuickReply[]).map(
          (r) => r.content["en"] ?? r.content["ko"] ?? Object.values(r.content)[0]
        );
        setQuickReplies(texts);
      }
    };
    init();
  }, [designerId, router]);

  const handleSend = async (text: string, isQuickReply = false) => {
    if (!myId || sending) return;
    setSending(true);

    const supabase = createClient();

    const { data: conv, error } = await supabase
      .from("conversation")
      .insert({ client_id: myId, designer_id: designerId })
      .select("id")
      .single();

    let convId = conv?.id;
    if (error || !convId) {
      const { data: existing } = await supabase
        .from("conversation")
        .select("id")
        .eq("client_id", myId)
        .eq("designer_id", designerId)
        .maybeSingle();
      convId = existing?.id;
    }
    if (!convId) { setSending(false); return; }

    await supabase.from("message").insert({
      conversation_id: convId,
      sender_id: myId,
      content: text,
      sender_lang: myLang,
      is_quick_reply: isQuickReply,
    });

    await supabase
      .from("conversation")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", convId);

    router.replace(`/chat/${convId}`);
  };

  return (
    <div className="flex flex-col h-full bg-surface-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-50 border-b border-b-[0.5px] border-surface-300 pt-14 pb-2.5">
        <div className="flex items-center justify-between pl-4 pr-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center size-6"
            >
              <img src="/icons/chevron-left.svg" alt="back" width={16} height={16} />
            </button>
            <div className="size-8 rounded-full overflow-hidden bg-surface-300 text-surface-500 flex items-center justify-center shrink-0">
              {designerAvatar ? (
                <img src={designerAvatar} alt="" className="size-full object-cover" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="9" r="4" />
                  <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
                </svg>
              )}
            </div>
            <div className="flex flex-col">
              <p className="typo-h6 text-surface-950">{designerName || "Designer"}</p>
              {designerSalon && (
                <p className="typo-caption2 text-surface-600">{designerSalon}</p>
              )}
            </div>
          </div>
          <button className="flex items-center justify-center size-10 p-2.5">
            <img src="/icons/more.svg" alt="more" width={24} height={24} />
          </button>
        </div>
      </div>

      {/* Welcome message */}
      <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-hide">
        <div className="flex gap-2.5 items-start">
          <div className="size-8 rounded-full overflow-hidden bg-surface-300 text-surface-500 flex items-center justify-center shrink-0">
            {designerAvatar ? (
              <img src={designerAvatar} alt="" className="size-full object-cover" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="9" r="4" />
                <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
              </svg>
            )}
          </div>
          <div className="bg-white px-4 py-3 rounded-2xl max-w-[260px] flex flex-col gap-3">
            <p className="typo-body1 text-surface-950">
              Hi! My name is {designerName || "the designer"}. Please select the option below or ask any questions about the service or your hair concerns.
            </p>
            <div className="flex flex-col gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSend(reply, true)}
                  disabled={sending}
                  className="bg-surface-200 flex items-center justify-center py-2.5 px-3 rounded-lg disabled:opacity-50"
                >
                  <span className="typo-body2 text-surface-950 whitespace-nowrap">{reply}</span>
                </button>
              ))}
            </div>
            <p className="typo-caption2 text-surface-500">
              This is an automated message.{"\n"}Conversation starts by sending an inquiry.
            </p>
          </div>
        </div>
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} designerId={designerId} />
    </div>
  );
}
