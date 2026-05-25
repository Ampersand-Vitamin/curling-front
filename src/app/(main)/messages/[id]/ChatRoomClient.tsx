"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/SafeImage";
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

function BubbleContent({ message }: { message: Message }) {
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
  return <p className="typo-body1 text-surface-950">{message.content}</p>;
}

function DesignerBubble({
  message,
  profileImage,
  designerName,
}: {
  message: Message;
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
      <div className="bg-surface-white rounded-2xl px-4 py-3 max-w-[260px]">
        <BubbleContent message={message} />
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

/* ── Attach Panel ─────────────────────────────────────── */

function AttachPanel({
  onPickGallery,
  onHairProfile,
}: {
  onPickGallery: () => void;
  onHairProfile: () => void;
}) {
  const items = [
    { icon: "/icons/photo.svg", label: "from Gallery", action: onPickGallery },
    { icon: "/icons/style.svg", label: "Send my Hair Profile", action: onHairProfile },
    { icon: "/icons/portfolio.svg", label: "Designer's Portfolio", action: () => {} },
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
  disabled,
}: {
  onSend: (text: string) => void;
  onSendImage: (file: File) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
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
            onClick={() => setPanelOpen((v) => !v)}
            className={`size-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              panelOpen ? "bg-surface-800" : "bg-surface-200"
            }`}
            aria-label="More"
          >
            <img
              src="/icons/add.svg"
              alt=""
              width={18}
              height={18}
              className={panelOpen ? "invert" : ""}
            />
          </button>
        )}
      </form>

      {/* attach panel */}
      {panelOpen && (
        <AttachPanel onPickGallery={openGallery} onHairProfile={loadHairProfile} />
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
}: {
  conversation: ConversationDetail;
  initialMessages: Message[];
  currentUserId: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);

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
              },
            ];
          });
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
      },
    ]);

    // persist
    const supabase = createClient();
    await supabase.from("message").insert({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content: text,
    });
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
      },
    ]);

    // persist
    await supabase.from("message").insert({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content: "",
      message_type: "image",
      image_url: storagePath,
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
            />
          ),
        )}
      </div>

      <Composer onSend={handleSend} onSendImage={handleSendImage} disabled={false} />
    </div>
  );
}
