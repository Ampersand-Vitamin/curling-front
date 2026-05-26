"use client";

import { useState } from "react";
import type { Message } from "@/hooks/useChat";
import { PhotoMessage, parseImageMessage } from "@/components/chat/PhotoMessage";
import { HairProfileCard, parseHairProfile } from "@/components/message/HairProfileCard";

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

function Avatar({ avatarUrl }: { avatarUrl?: string | null }) {
  return (
    <div className="size-8 rounded-full overflow-hidden bg-surface-300 text-surface-500 flex items-center justify-center shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="9" r="4" />
          <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
        </svg>
      )}
    </div>
  );
}

export function MessageBubble({ message, isMine, myLang, partnerAvatarUrl }: Props) {
  const [showOriginal, setShowOriginal] = useState(false);

  const imageUrls = parseImageMessage(message.content);
  const isImage = imageUrls !== null;
  const hairProfile = !isImage ? parseHairProfile(message.content) : null;
  const isHairProfile = hairProfile !== null;

  const translated = message.content_translated?.[myLang];
  const hasTranslation = !isImage && !isHairProfile && !!translated && translated !== message.content;
  const displayText = showOriginal || !hasTranslation ? message.content : translated;
  const isTranslating =
    !isImage &&
    !isHairProfile &&
    !isMine &&
    !message.is_quick_reply &&
    !translated &&
    !!message.sender_lang &&
    message.sender_lang !== myLang;

  const time = message.created_at ? formatTime(message.created_at) : "";

  if (isMine) {
    if (isImage) {
      return (
        <div className="flex gap-2.5 items-end justify-end">
          <span className="typo-caption2 text-surface-500 shrink-0">{time}</span>
          <PhotoMessage urls={imageUrls} />
        </div>
      );
    }
    if (isHairProfile) {
      return (
        <div className="flex gap-2.5 items-end justify-end">
          <span className="typo-caption2 text-surface-500 shrink-0">{time}</span>
          <HairProfileCard
            name={hairProfile.name}
            bio={hairProfile.bio}
            avatarUrl={hairProfile.avatarUrl}
            keywords={hairProfile.keywords}
          />
        </div>
      );
    }
    return (
      <div className="flex gap-2.5 items-end justify-end">
        <span className="typo-caption2 text-surface-500 shrink-0">{time}</span>
        <div className="bg-primary-400 px-4 py-3 rounded-2xl max-w-[270px]">
          <p className="typo-body1 text-white break-words">{displayText}</p>
        </div>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="flex gap-2.5 items-end">
        <Avatar avatarUrl={partnerAvatarUrl} />
        <PhotoMessage urls={imageUrls} />
        <span className="typo-caption2 text-surface-500 shrink-0">{time}</span>
      </div>
    );
  }

  if (isHairProfile) {
    return (
      <div className="flex gap-2.5 items-end">
        <Avatar avatarUrl={partnerAvatarUrl} />
        <HairProfileCard
          name={hairProfile.name}
          bio={hairProfile.bio}
          avatarUrl={hairProfile.avatarUrl}
          keywords={hairProfile.keywords}
        />
        <span className="typo-caption2 text-surface-500 shrink-0">{time}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 items-start">
      <Avatar avatarUrl={partnerAvatarUrl} />
      <div className="bg-white px-4 py-3 rounded-2xl max-w-[260px] flex flex-col gap-2">
        {isTranslating ? (
          <span className="typo-body1 text-surface-400 animate-pulse">Translating...</span>
        ) : (
          <p
            key={displayText}
            className="typo-body1 text-surface-950 break-words"
            style={{ animation: "fadeIn 0.15s ease-out" }}
          >
            {displayText}
          </p>
        )}
        {hasTranslation && !isTranslating && (
          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            className="typo-caption2 text-left transition-opacity duration-150"
            style={{ color: "#b8b7b5" }}
          >
            {showOriginal ? "Translated to English" : "See original"}
          </button>
        )}
      </div>
      <span className="typo-caption2 text-surface-500 shrink-0 self-end">{time}</span>
    </div>
  );
}
