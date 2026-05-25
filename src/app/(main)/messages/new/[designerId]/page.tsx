"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { createClient } from "@/lib/supabase/client";
import type { QuickReply } from "@/types/message";

const DEFAULT_QUICK_REPLIES = [
  "Hi! I'd like a consultation",
  "When are you available?",
  "How much does it cost?",
];

type DesignerProfile = {
  display_name: string;
  profile_image_url: string | null;
  salon: { name: string } | null;
};

type RawQuickReply = {
  id: string;
  type: string;
  content: Record<string, string>;
  sort_order: number;
  is_active: boolean;
};

function pickLocalizedContent(content: Record<string, string>, lang: string) {
  return content[lang] ?? content.en ?? content.ko ?? Object.values(content)[0] ?? "";
}

export default function NewMessagePage() {
  const router = useRouter();
  const params = useParams<{ designerId: string }>();
  const designerId = params.designerId;
  const initialized = useRef(false);

  const [myId, setMyId] = useState("");
  const [myLang, setMyLang] = useState("en");
  const [designerName, setDesignerName] = useState("Designer");
  const [designerSalon, setDesignerSalon] = useState<string | null>(null);
  const [designerAvatar, setDesignerAvatar] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>(DEFAULT_QUICK_REPLIES);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }

      setMyId(user.id);

      const { data: existing } = await supabase
        .from("conversation")
        .select("id")
        .eq("client_id", user.id)
        .eq("designer_id", designerId)
        .maybeSingle();

      if (existing) {
        router.replace(`/messages/${existing.id}`);
        return;
      }

      const [{ data: myProfile }, { data: designer }, { data: replies }] =
        await Promise.all([
          supabase
            .from("onboarding_profiles")
            .select("languages")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("designer_profile")
            .select("display_name, profile_image_url, salon:salon_id ( name )")
            .eq("id", designerId)
            .maybeSingle(),
          supabase
            .from("quick_reply")
            .select("id, type, content, sort_order, is_active")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .limit(5),
        ]);

      const languages = myProfile?.languages as string[] | null | undefined;
      const nextLang = languages?.[0] ?? "en";
      setMyLang(nextLang);

      if (designer) {
        const profile = designer as unknown as DesignerProfile;
        setDesignerName(profile.display_name);
        setDesignerSalon(profile.salon?.name ?? null);
        setDesignerAvatar(profile.profile_image_url);
      }

      const rows = ((replies ?? []) as unknown as RawQuickReply[]).map(
        (reply): QuickReply => ({
          id: reply.id,
          type: reply.type,
          content: reply.content,
          sortOrder: reply.sort_order,
          isActive: reply.is_active,
        }),
      );

      if (rows.length > 0) {
        setQuickReplies(
          rows
            .map((reply) => pickLocalizedContent(reply.content, nextLang))
            .filter(Boolean),
        );
      }
    }

    init();
  }, [designerId, router]);

  async function handleSend(content: string) {
    const trimmed = content.trim();
    if (!trimmed || !myId || sending) return;

    setSending(true);
    const supabase = createClient();

    const { data: conversation, error } = await supabase
      .from("conversation")
      .insert({ client_id: myId, designer_id: designerId })
      .select("id")
      .single();

    let conversationId = conversation?.id;
    if (error || !conversationId) {
      const { data: existing } = await supabase
        .from("conversation")
        .select("id")
        .eq("client_id", myId)
        .eq("designer_id", designerId)
        .maybeSingle();
      conversationId = existing?.id;
    }

    if (!conversationId) {
      setSending(false);
      return;
    }

    await supabase.from("message").insert({
      conversation_id: conversationId,
      sender_id: myId,
      content: trimmed,
      sender_lang: myLang,
    });

    router.replace(`/messages/${conversationId}`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSend(text);
  }

  return (
    <div className="flex flex-col h-full bg-surface-100">
      <div className="sticky top-0 z-20 bg-surface-50 border-b border-surface-300">
        <div className="h-[env(safe-area-inset-top,0px)]" />
        <div className="flex items-center justify-between pl-4 pr-3 py-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="size-6 flex items-center justify-center shrink-0"
              aria-label="Go back"
            >
              <img src="/icons/chevron-left.svg" alt="" width={16} height={16} />
            </button>
            <div className="size-8 rounded-full overflow-hidden bg-surface-200 shrink-0">
              <SafeImage
                src={designerAvatar}
                alt={designerName}
                fallback="profile"
                className="size-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="typo-body1 font-medium text-surface-950 truncate">
                {designerName}
              </p>
              {designerSalon && (
                <p className="typo-caption2 text-surface-600 truncate">
                  {designerSalon}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-5">
        <div className="flex gap-2.5 items-start">
          <div className="size-8 rounded-full overflow-hidden bg-surface-200 shrink-0">
            <SafeImage
              src={designerAvatar}
              alt={designerName}
              fallback="profile"
              className="size-full object-cover"
            />
          </div>
          <div className="bg-surface-white rounded-2xl px-4 py-3 max-w-[260px] flex flex-col gap-3">
            <p className="typo-body1 text-surface-950">
              Hi! My name is {designerName}. Please select an option below or ask
              any questions about the service or your hair concerns.
            </p>
            <div className="flex flex-col gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => handleSend(reply)}
                  disabled={sending}
                  className="bg-surface-200 rounded-lg px-3 py-2.5 disabled:opacity-50"
                >
                  <span className="typo-body2 text-surface-950">{reply}</span>
                </button>
              ))}
            </div>
            <div className="typo-caption2 text-surface-500 tracking-[-0.055px]">
              <p>This is an automated message.</p>
              <p>Conversation starts by sending an inquiry.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-surface-white rounded-t-2xl shadow-[0px_-4px_30px_rgba(0,0,0,0.1)]">
        <form onSubmit={handleSubmit} className="flex items-center gap-1 px-4 py-3">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend(text);
              }
            }}
            placeholder="Message"
            rows={text.includes("\n") ? Math.min(text.split("\n").length, 6) : 1}
            disabled={sending}
            className="flex-1 min-h-12 bg-surface-200 rounded-3xl px-4 py-3 typo-body1 text-surface-950 placeholder:text-surface-400 outline-none resize-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="size-12 rounded-full bg-surface-200 flex items-center justify-center shrink-0 disabled:opacity-40"
            aria-label="Send"
          >
            <img src="/icons/send.svg" alt="" width={20} height={20} />
          </button>
        </form>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}
