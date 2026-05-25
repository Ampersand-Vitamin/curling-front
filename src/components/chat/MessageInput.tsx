"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  onSend: (text: string, isQuickReply?: boolean) => void;
  designerId?: string;
};

const ATTACH_ITEMS = [
  { label: "from Gallery",         icon: "/icons/photo.svg",     href: null,        isFile: true  },
  { label: "Send my Hair Profile", icon: "/icons/style.svg",     href: "/my",       isFile: false },
  { label: "Designer's Portfolio", icon: "/icons/portfolio.svg", href: null,        isFile: false },
  { label: "My Favorite",          icon: "/icons/bookmark.svg",  href: "/favorite", isFile: false },
] as const;

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const hasText = text.trim().length > 0;

  const handleSend = () => {
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

  const handleAttachItem = (idx: number) => {
    const item = ATTACH_ITEMS[idx];
    if (item.isFile) { fileInputRef.current?.click(); return; }
    let href = item.href as string | null;
    if (idx === 2 && designerId) href = `/designer/${designerId}`;
    if (href) { router.push(href); setShowAttach(false); }
  };

  return (
    <div className="bg-white rounded-tl-[16px] rounded-tr-[16px] shadow-[0px_4px_30px_0px_rgba(0,0,0,0.1)] flex flex-col">
      {/* Attachment panel */}
      {showAttach && (
        <div className="px-4 pt-3 pb-1">
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

      {/* Input row */}
      <div className="flex items-end gap-1 px-4 py-3">
        {/* + button */}
        <button
          onClick={() => setShowAttach((v) => !v)}
          className={`shrink-0 size-12 flex items-center justify-center rounded-full transition-colors ${
            showAttach ? "bg-surface-800" : "bg-surface-200"
          }`}
        >
          <MaskIcon
            src="/icons/add.svg"
            color={showAttach ? "#ffffff" : "var(--color-surface-700)"}
          />
        </button>

        {/* Text input */}
        <div className="flex-1 bg-surface-200 rounded-[24px] px-4 py-[10px] flex items-end min-h-[48px]">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            rows={1}
            placeholder="Message"
            className="flex-1 bg-transparent resize-none outline-none typo-body1 text-surface-950 placeholder:text-surface-400 max-h-[120px]"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!hasText}
          className={`shrink-0 size-12 flex items-center justify-center rounded-full transition-colors ${
            hasText ? "bg-primary-400" : "bg-surface-200"
          }`}
        >
          <MaskIcon
            src="/icons/send.svg"
            color={hasText ? "#ffffff" : "var(--color-surface-700)"}
          />
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
    </div>
  );
}
