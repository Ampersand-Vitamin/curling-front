"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { useTranslation } from "@/hooks/useTranslation";
import { createClient } from "@/lib/supabase/client";
import { storageUrl } from "@/lib/storage";
import type { ConversationDetail } from "@/lib/messages";
import type { Message } from "@/types/message";

/* ── helpers ──────────────────────────────────────────── */

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
}

/* ── Header ───────────────────────────────────────────── */

function ChatHeader({ conversation }: { conversation: ConversationDetail }) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-10 bg-surface-50 border-b border-surface-300">
      {/* safe area spacer */}
      <div className="h-[env(safe-area-inset-top,0px)]" />

      <div className="flex items-center justify-between pl-4 pr-3 py-2">
        <div className="flex items-center gap-2.5">
          {/* back */}
          <button
            type="button"
            onClick={() => router.back()}
            className="size-6 flex items-center justify-center"
            aria-label="Go back"
          >
            <img src="/icons/chevron-left.svg" alt="" width={16} height={16} />
          </button>

          {/* designer profile */}
          <div className="size-8 rounded-full overflow-hidden bg-surface-200 shrink-0">
            <SafeImage
              src={conversation.designerProfileImage}
              alt={conversation.designerName}
              fallback="profile"
              className="size-full object-cover"
            />
          </div>

          {/* name + salon */}
          <div className="flex flex-col">
            <p className="typo-body1 font-medium text-surface-950 leading-6 tracking-[-0.16px]">
              {conversation.designerName}
            </p>
            {conversation.designerSalonName && (
              <p className="typo-caption2 text-surface-600 leading-[13px]">
                {conversation.designerSalonName}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Welcome Message (자동 첫 메시지) ─────────────────── */

function WelcomeMessage({
  profileImage,
  designerName,
}: {
  profileImage: string | null;
  designerName: string;
}) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="size-8 rounded-full overflow-hidden bg-surface-200 shrink-0">
        <SafeImage
          src={profileImage}
          alt={designerName}
          fallback="profile"
          className="size-full object-cover"
        />
      </div>
      <div className="bg-surface-white rounded-2xl px-4 py-3 max-w-[260px] flex flex-col gap-3">
        <p className="typo-body1 text-surface-950">
          Hi! My name is {designerName}. Please feel free to ask any questions
          about the service or your hair concerns.
        </p>
        <div className="typo-caption2 text-surface-500 tracking-[-0.055px]">
          <p>This is an automated message.</p>
          <p>Conversation starts by sending an inquiry.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Message Bubble ───────────────────────────────────── */

function BubbleContent({
  message,
  text,
}: {
  message: Message;
  text?: string;
}) {
  if (message.messageType === "image" && message.imageUrl) {
    const src = message.imageUrl.startsWith("http")
      ? message.imageUrl
      : storageUrl(message.imageUrl);
    return (
      <img
        src={src}
        alt="Shared image"
        className="rounded-xl max-w-[220px] max-h-[300px] object-cover"
      />
    );
  }
  return <p className="typo-body1 text-surface-950">{text ?? message.content}</p>;
}

function DesignerBubble({
  message,
  profileImage,
  designerName,
  translation,
  isTranslating,
}: {
  message: Message;
  profileImage: string | null;
  designerName: string;
  translation: string | null;
  isTranslating: boolean;
}) {
  const [showTranslation, setShowTranslation] = useState(false);
  const canTranslate =
    message.messageType === "text" && !!translation && translation !== message.content;
  const displayText = showTranslation && canTranslate ? translation : message.content;

  return (
    <div className="flex gap-2.5 items-start">
      <div className="size-8 rounded-full overflow-hidden bg-surface-200 shrink-0">
        <SafeImage
          src={profileImage}
          alt={designerName}
          fallback="profile"
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-col items-start gap-1">
        <div className="bg-surface-white rounded-2xl px-4 py-3 max-w-[260px]">
          <BubbleContent message={message} text={displayText} />
        </div>
        {message.messageType === "text" && (canTranslate || isTranslating) && (
          <button
            type="button"
            onClick={() => setShowTranslation((value) => !value)}
            disabled={isTranslating || !canTranslate}
            className="typo-caption2 text-surface-500 underline underline-offset-2 disabled:no-underline disabled:text-surface-400"
          >
            {isTranslating
              ? "번역 중..."
              : showTranslation
                ? "원문 보기"
                : "번역 보기"}
          </button>
        )}
      </div>
      <div className="flex items-end self-stretch min-w-0 flex-1">
        <span className="typo-caption2 text-surface-500 tracking-[-0.055px]">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

function MyBubble({ message }: { message: Message }) {
  return (
    <div className="flex gap-2.5 items-start justify-end">
      <div className="flex items-end self-stretch min-w-0">
        <span className="typo-caption2 text-surface-500 tracking-[-0.055px]">
          {formatTime(message.createdAt)}
        </span>
      </div>
      <div className="bg-primary-100 rounded-2xl px-4 py-3 max-w-[260px]">
        <BubbleContent message={message} />
      </div>
    </div>
  );
}

/* ── Portfolio Picker Modal ────────────────────────────── */

function PortfolioPicker({
  designerId,
  onSend,
  onClose,
}: {
  designerId: string;
  onSend: (imageUrls: string[]) => void;
  onClose: () => void;
}) {
  const [images, setImages] = useState<{ id: string; path: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("portfolio")
      .select("id, image_path")
      .eq("designer_id", designerId)
      .order("display_order", { ascending: true })
      .then(({ data }) => {
        setImages((data ?? []).map((r) => ({ id: r.id, path: r.image_path })));
        setLoading(false);
      });
  }, [designerId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  }

  function handleSend() {
    const urls = images
      .filter((img) => selected.has(img.id))
      .map((img) => img.path);
    onSend(urls);
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-3 max-h-[320px]">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="size-6 flex items-center justify-center">
            <img src="/icons/chevron-left.svg" alt="" width={16} height={16} />
          </button>
          <p className="typo-h4 text-surface-950">Designer&apos;s Portfolio</p>
        </div>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={handleSend}
            className="typo-body2 font-medium text-primary-600"
          >
            Send ({selected.size})
          </button>
        )}
      </div>

      {/* grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="typo-body2 text-surface-400">Loading...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="typo-body2 text-surface-400">No portfolio images</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => {
              const isSelected = selected.has(img.id);
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => toggle(img.id)}
                  className="relative aspect-[3/4] overflow-hidden rounded-lg"
                >
                  <SafeImage
                    src={img.path}
                    alt="Portfolio"
                    fallback="portfolio"
                    className="size-full object-cover"
                  />
                  {/* selection circle */}
                  <div className="absolute top-1.5 right-1.5">
                    <div
                      className={`size-4 rounded-full border-2 backdrop-blur-[15px] ${
                        isSelected
                          ? "bg-primary-600 border-primary-600"
                          : "border-surface-white"
                      }`}
                    />
                  </div>
                  {/* bottom overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-surface-950/50 to-transparent" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Attach Panel ─────────────────────────────────────── */

function AttachPanel({
  onPickGallery,
  onHairProfile,
  onPickPortfolio,
}: {
  onPickGallery: () => void;
  onHairProfile: () => void;
  onPickPortfolio: () => void;
}) {
  const items = [
    { icon: "/icons/photo.svg", label: "from Gallery", action: onPickGallery },
    { icon: "/icons/style.svg", label: "Send my Hair Profile", action: onHairProfile },
    { icon: "/icons/portfolio.svg", label: "Designer's Portfolio", action: onPickPortfolio },
    { icon: "/icons/bookmark.svg", label: "My Favorite", action: () => {} },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 px-4 pb-3">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.action}
          className="flex flex-col items-center gap-2 bg-surface-200 rounded-lg px-2 py-4"
        >
          <div className="flex items-center justify-center p-3">
            <img src={item.icon} alt="" width={24} height={24} />
          </div>
          <span className="typo-body2 text-surface-700 text-center tracking-[-0.14px]">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Composer ─────────────────────────────────────────── */

function Composer({
  onSend,
  onSendImage,
  onSendPortfolioImages,
  designerId,
  disabled,
}: {
  onSend: (text: string) => void;
  onSendImage: (file: File) => void;
  onSendPortfolioImages: (imageUrls: string[]) => void;
  designerId: string;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    setPanelOpen(false);
  }

  function openGallery() {
    fileInputRef.current?.click();
    setPanelOpen(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSendImage(file);
    e.target.value = "";
  }

  async function loadHairProfile() {
    setLoadingProfile(true);
    setPanelOpen(false);
    try {
      const res = await fetch("/api/onboarding");
      const { profile } = await res.json();
      if (!profile) {
        setText("(No hair profile set up yet)");
        return;
      }
      const lines = [
        `🧑 ${profile.name || "Anonymous"}`,
        profile.gender && `Gender: ${profile.gender}`,
        profile.hair_type && `Hair type: ${profile.hair_type}`,
        profile.hair_length && `Length: ${profile.hair_length}`,
        profile.hair_color && `Color: ${profile.hair_color}`,
        profile.hair_concerns?.length && `Concerns: ${profile.hair_concerns.join(", ")}`,
        profile.hair_history?.length && `History: ${profile.hair_history.join(", ")}`,
        profile.preferred_styles?.length && `Preferred styles: ${profile.preferred_styles.join(", ")}`,
      ].filter(Boolean);
      setText(`[My Hair Profile]\n${lines.join("\n")}`);
      // 자동 포커스 + 커서를 끝으로
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      });
    } catch {
      setText("(Failed to load hair profile)");
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <div className="sticky bottom-0 bg-surface-white rounded-t-2xl shadow-[0px_-4px_30px_rgba(0,0,0,0.1)]">
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1 px-4 py-3"
      >
        {/* left: photo (quick access) */}
        <button
          type="button"
          onClick={openGallery}
          className="size-12 rounded-full bg-surface-200 flex items-center justify-center shrink-0"
          aria-label="Attach photo"
        >
          <img src="/icons/photo.svg" alt="" width={20} height={20} />
        </button>

        {/* text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setPanelOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Message"
          rows={text.includes("\n") ? Math.min(text.split("\n").length, 6) : 1}
          className="flex-1 min-h-12 bg-surface-200 rounded-3xl px-4 py-3 typo-body1 text-surface-950 placeholder:text-surface-400 outline-none resize-none"
          disabled={disabled || loadingProfile}
        />

        {/* right: add (no text) / send (has text) */}
        {text.trim() ? (
          <button
            type="submit"
            disabled={disabled}
            className="size-12 rounded-full bg-surface-200 flex items-center justify-center shrink-0 disabled:opacity-40"
            aria-label="Send"
          >
            <img src="/icons/send.svg" alt="" width={20} height={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (portfolioOpen) {
                setPortfolioOpen(false);
                setPanelOpen(true);
              } else {
                setPanelOpen((v) => !v);
              }
            }}
            className={`size-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              panelOpen || portfolioOpen ? "bg-surface-800" : "bg-surface-200"
            }`}
            aria-label="More"
          >
            <img
              src="/icons/add.svg"
              alt=""
              width={18}
              height={18}
              className={panelOpen || portfolioOpen ? "invert" : ""}
            />
          </button>
        )}
      </form>

      {/* attach panel */}
      {panelOpen && (
        <AttachPanel
          onPickGallery={openGallery}
          onHairProfile={loadHairProfile}
          onPickPortfolio={() => {
            setPanelOpen(false);
            setPortfolioOpen(true);
          }}
        />
      )}

      {/* portfolio picker modal */}
      {portfolioOpen && (
        <PortfolioPicker
          designerId={designerId}
          onSend={(urls) => {
            setPortfolioOpen(false);
            onSendPortfolioImages(urls);
          }}
          onClose={() => setPortfolioOpen(false)}
        />
      )}

      {/* bottom safe area */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────── */

export default function ChatRoomClient({
  conversation,
  initialMessages,
  currentUserId,
  myLang,
}: {
  conversation: ConversationDetail;
  initialMessages: Message[];
  currentUserId: string;
  myLang: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const { getTranslation, isTranslating } = useTranslation(messages, { myLang });

  // scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const m = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            message_type: string;
            image_url: string | null;
            is_read: boolean;
            created_at: string;
            sender_lang: string | null;
            content_translated: Record<string, string> | null;
          };
          setMessages((prev) => {
            if (prev.some((p) => p.id === m.id)) return prev;
            return [
              ...prev,
              {
                id: m.id,
                conversationId: m.conversation_id,
                senderId: m.sender_id,
                content: m.content,
                messageType: (m.message_type ?? "text") as "text" | "image",
                imageUrl: m.image_url ?? null,
                isRead: m.is_read,
                createdAt: m.created_at,
                senderLang: m.sender_lang ?? null,
                contentTranslated: m.content_translated ?? null,
              },
            ];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const m = payload.new as {
            id: string;
            sender_lang: string | null;
            content_translated: Record<string, string> | null;
          };
          setMessages((prev) =>
            prev.map((message) =>
              message.id === m.id
                ? {
                    ...message,
                    senderLang: m.sender_lang ?? null,
                    contentTranslated: m.content_translated ?? null,
                  }
                : message,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  async function handleSend(text: string) {
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();

    // optimistic — 즉시 UI에 반영
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversationId: conversation.id,
        senderId: currentUserId,
        content: text,
        messageType: "text",
        imageUrl: null,
        isRead: false,
        createdAt: now,
        senderLang: myLang,
        contentTranslated: null,
      },
    ]);

    // persist
    const supabase = createClient();
    await supabase.from("message").insert({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content: text,
      sender_lang: myLang,
    });
  }

  async function handleSendPortfolioImages(imageUrls: string[]) {
    const supabase = createClient();
    const now = new Date();
    for (let i = 0; i < imageUrls.length; i++) {
      const tempId = crypto.randomUUID();
      const ts = new Date(now.getTime() + i).toISOString();

      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          conversationId: conversation.id,
          senderId: currentUserId,
          content: "",
          messageType: "image",
          imageUrl: imageUrls[i],
          isRead: false,
          createdAt: ts,
          senderLang: myLang,
          contentTranslated: null,
        },
      ]);

      await supabase.from("message").insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        content: "",
        message_type: "image",
        image_url: imageUrls[i],
        sender_lang: myLang,
      });
    }
  }

  async function handleSendImage(file: File) {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${conversation.id}/${crypto.randomUUID()}.${ext}`;

    // upload to Storage
    const { error: uploadErr } = await supabase.storage
      .from("chat-images")
      .upload(path, file);

    if (uploadErr) {
      console.error("Image upload failed", uploadErr);
      return;
    }

    const storagePath = `chat-images/${path}`;
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();

    // optimistic
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversationId: conversation.id,
        senderId: currentUserId,
        content: "",
        messageType: "image",
        imageUrl: storagePath,
        isRead: false,
        createdAt: now,
        senderLang: myLang,
        contentTranslated: null,
      },
    ]);

    // persist
    await supabase.from("message").insert({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content: "",
      message_type: "image",
      image_url: storagePath,
      sender_lang: myLang,
    });
  }

  return (
    <div className="flex flex-col h-full bg-surface-100">
      <ChatHeader conversation={conversation} />

      {/* messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-5 flex flex-col gap-4"
      >
        {/* 자동 웰컴 메시지 (항상 첫 번째) */}
        <WelcomeMessage
          profileImage={conversation.designerProfileImage}
          designerName={conversation.designerName}
        />

        {messages.map((msg) =>
          msg.senderId === currentUserId ? (
            <MyBubble key={msg.id} message={msg} />
          ) : (
            <DesignerBubble
              key={msg.id}
              message={msg}
              profileImage={conversation.designerProfileImage}
              designerName={conversation.designerName}
              translation={getTranslation(msg)}
              isTranslating={isTranslating(msg.id)}
            />
          ),
        )}
      </div>

      <Composer
        onSend={handleSend}
        onSendImage={handleSendImage}
        onSendPortfolioImages={handleSendPortfolioImages}
        designerId={conversation.designerId}
        disabled={false}
      />
    </div>
  );
}
