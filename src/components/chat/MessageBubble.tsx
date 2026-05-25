"use client";

import { useState } from "react";
import type { Message } from "@/hooks/useChat";

type Props = {
  message: Message;
  isMine: boolean;
  myLang: string;
  partnerAvatarUrl?: string | null;
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function MessageBubble({ message, isMine, myLang, partnerAvatarUrl }: Props) {
  const [showOriginal, setShowOriginal] = useState(false);

  const translated = message.content_translated?.[myLang];
  const hasTranslation = !!translated && translated !== message.content;
  const displayText = showOriginal || !hasTranslation ? message.content : translated;
  const isTranslating =
    !isMine &&
    !message.is_quick_reply &&
    !translated &&
    !!message.sender_lang &&
    message.sender_lang !== myLang;

  const time = message.created_at ? formatTime(message.created_at) : "";

  if (isMine) {
    return (
      <div className="flex gap-2.5 items-end justify-end">
        <span className="typo-caption2 text-surface-500 shrink-0">{time}</span>
        <div className="bg-primary-400 px-4 py-3 rounded-2xl max-w-[270px]">
          <p className="typo-body1 text-white break-words">{displayText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 items-start">
      <div className="flex gap-2.5 items-start">
        <div className="size-8 rounded-full overflow-hidden bg-surface-300 text-surface-500 flex items-center justify-center shrink-0">
          {partnerAvatarUrl ? (
            <img src={partnerAvatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="9" r="4" />
              <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
            </svg>
          )}
        </div>
        <div className="bg-white px-4 py-3 rounded-2xl max-w-[260px]">
          {isTranslating ? (
            <span className="typo-body1 text-surface-400 animate-pulse">번역 중...</span>
          ) : (
            <p className="typo-body1 text-surface-950 break-words">{displayText}</p>
          )}
        </div>
        <span className="typo-caption2 text-surface-500 shrink-0 self-end">{time}</span>
      </div>
      {hasTranslation && (
        <button
          onClick={() => setShowOriginal((v) => !v)}
          className="typo-caption2 text-surface-400 underline underline-offset-2 ml-[42px]"
        >
          {showOriginal ? "번역 보기" : "원문 보기"}
        </button>
      )}
    </div>
  );
}
