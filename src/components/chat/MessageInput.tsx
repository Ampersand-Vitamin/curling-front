"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PortfolioPickerPanel } from "@/components/chat/PortfolioPickerPanel";
import { createClient } from "@/lib/supabase/client";
import type { HairProfileKeyword } from "@/components/message/HairProfileCard";

type Props = {
  onSend: (text: string, isQuickReply?: boolean) => void;
  designerId?: string;
};

const ATTACH_ITEMS = [
  { label: "from Gallery",         icon: "/icons/photo.svg",     href: null,        isFile: true  },
  { label: "Send my Hair Profile", icon: "/icons/style.svg",     href: null,        isFile: false },
  { label: "Designer's Portfolio", icon: "/icons/portfolio.svg", href: null,        isFile: false },
  { label: "My Favorite",          icon: "/icons/bookmark.svg",  href: "/favorite", isFile: false },
] as const;

const LANG_MAP: Record<string, { label: string; flag?: string }> = {
  ko:  { label: "한국어",   flag: "/flags/korean-flag.svg" },
  en:  { label: "English",  flag: "/flags/british-flag.svg" },
  zh:  { label: "中文",     flag: "/flags/chinese-flag.svg" },
  yue: { label: "广东话",   flag: "/flags/hong-kong-flag.svg" },
  ja:  { label: "日本語",   flag: "/flags/japanese-flag.svg" },
  ar:  { label: "العربية",  flag: "/flags/saudi-flag.svg" },
  fr:  { label: "Français", flag: "/flags/french-flag.svg" },
  es:  { label: "Español" },
  de:  { label: "Deutsch" },
};

const HAIR_TYPE_MAP: Record<string, string> = {
  straight: "Straight Hair",
  wavy:     "Wavy Hair",
  curly:    "Curly Hair",
  coily:    "Coily Hair",
};

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildKeywords(profile: Record<string, unknown>): HairProfileKeyword[] {
  const kws: HairProfileKeyword[] = [];
  if (profile.gender)     kws.push({ label: cap(profile.gender as string) });
  for (const code of (profile.languages as string[] ?? [])) {
    const l = LANG_MAP[code];
    if (l) kws.push(l); else kws.push({ label: code });
  }
  if (profile.age)        kws.push({ label: profile.age as string });
  if (profile.hair_type)  kws.push({ label: HAIR_TYPE_MAP[profile.hair_type as string] ?? cap(profile.hair_type as string) });
  if (profile.hair_length) kws.push({ label: cap(profile.hair_length as string) });
  if (profile.hair_color)  kws.push({ label: cap(profile.hair_color as string) });
  for (const c of (profile.hair_concerns as string[] ?? [])) kws.push({ label: cap(c) });
  for (const h of (profile.hair_history  as string[] ?? [])) kws.push({ label: cap(h) });
  return kws;
}

function MaskIcon({ src, color }: { src: string; color: string }) {
  return (
    <div
      className="size-6"
      style={{
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

export function MessageInput({ onSend, designerId }: Props) {
  const [text, setText] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [attachMode, setAttachMode] = useState<"designer-portfolio" | "my-favorite" | null>(null);
  const [renderedMode, setRenderedMode] = useState<"designer-portfolio" | "my-favorite" | null>(null);
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const canSend = text.trim().length > 0 || selectedPortfolios.length > 0;

  const handleSend = () => {
    if (selectedPortfolios.length > 0) {
      onSend(JSON.stringify({ type: "images", urls: selectedPortfolios }));
      setSelectedPortfolios([]);
      setAttachMode(null);
      setRenderedMode(null);
      setShowAttach(false);
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setShowAttach(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setShowAttach(false);
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/chat/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return data.url as string;
        })
      );
      onSend(JSON.stringify({ type: "images", urls }));
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAttachItem = async (idx: number) => {
    const item = ATTACH_ITEMS[idx];
    if (item.isFile) { fileInputRef.current?.click(); return; }
    if (idx === 1) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("onboarding_profiles")
        .select("name, bio, avatar_url, gender, languages, age, hair_type, hair_length, hair_color, hair_concerns, hair_history")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) return;
      onSend(JSON.stringify({
        type: "hair-profile",
        name: (profile.name as string) ?? "",
        bio:  (profile.bio  as string) ?? "",
        avatarUrl: (profile.avatar_url as string) ?? null,
        keywords: buildKeywords(profile as Record<string, unknown>),
      }));
      setShowAttach(false);
      return;
    }
    if (idx === 2) { setAttachMode("designer-portfolio"); setRenderedMode("designer-portfolio"); return; }
    if (idx === 3) { setAttachMode("my-favorite"); setRenderedMode("my-favorite"); return; }
    const href = item.href as string | null;
    if (href) { router.push(href); setShowAttach(false); }
  };

  return (
    <>
      {showAttach && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAttach(false)}
        />
      )}
      <div className="bg-white flex flex-col pb-8 w-full relative z-50" style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
      {/* Input row */}
      <div className="flex items-end gap-1 px-4 py-3">
        {/* + button */}
        <button
          onClick={() => {
            if (uploading) return;
            if (showAttach) { setAttachMode(null); setRenderedMode(null); setSelectedPortfolios([]); }
            setShowAttach((v) => !v);
          }}
          className={`shrink-0 size-12 flex items-center justify-center rounded-full transition-colors ${
            showAttach ? "bg-surface-800" : "bg-surface-200"
          }`}
        >
          {uploading ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="animate-spin">
              <circle cx="10" cy="10" r="7.5" stroke={showAttach ? "#ffffff" : "var(--color-surface-400)"} strokeWidth="2" opacity="0.3" />
              <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" stroke={showAttach ? "#ffffff" : "var(--color-surface-700)"} strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <MaskIcon
              src="/icons/add.svg"
              color={showAttach ? "#ffffff" : "var(--color-surface-700)"}
            />
          )}
        </button>

        {/* Text input */}
        <div className="flex-1 min-w-0 bg-surface-200 overflow-hidden px-4 py-3 flex items-end" style={{ borderRadius: 24 }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            rows={1}
            placeholder="Message"
            className="w-full bg-transparent resize-none outline-none typo-body1 text-surface-950 placeholder:text-surface-400 max-h-[120px]"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`shrink-0 size-12 flex items-center justify-center rounded-full transition-colors ${
            canSend ? "bg-primary-400" : "bg-surface-200"
          }`}
        >
          <MaskIcon
            src="/icons/send.svg"
            color={canSend ? "#ffffff" : "var(--color-surface-700)"}
          />
        </button>
      </div>

      {/* Attachment panel */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: showAttach ? (attachMode ? 360 : 210) : 0, opacity: showAttach ? 1 : 0 }}
      >
        {renderedMode ? (
          <div className="px-4 pt-1 pb-3">
            <PortfolioPickerPanel
              mode={renderedMode === "designer-portfolio" ? "designer" : "favorite"}
              designerId={designerId}
              selected={selectedPortfolios}
              onToggle={(url) =>
                setSelectedPortfolios((prev) =>
                  prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
                )
              }
              onBack={() => {
                setAttachMode(null);
                setSelectedPortfolios([]);
                setTimeout(() => setRenderedMode(null), 300);
              }}
            />
          </div>
        ) : (
          <div className="px-4 pt-1 pb-3">
            <div className="grid grid-cols-2 gap-2">
              {ATTACH_ITEMS.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => handleAttachItem(i)}
                  className="bg-surface-200 flex flex-col items-center gap-2 py-4 px-2 rounded-lg"
                >
                  <MaskIcon src={item.icon} color="var(--color-primary-400)" />
                  <span className="typo-body2 text-surface-700 text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
    </>
  );
}
