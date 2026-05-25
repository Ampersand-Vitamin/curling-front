"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  designerId: string;
  name: string;
  salonName: string;
  avatarUrl: string | null;
  myId: string;
};

export function StartConversationRow({ designerId, name, salonName, avatarUrl }: Props) {
  return (
    <div className="flex items-center gap-[10px] w-full">
      {/* Avatar */}
      <div
        className="rounded-full overflow-hidden shrink-0 border border-surface-400 bg-surface-200 text-surface-500 flex items-center justify-center"
        style={{ width: 40, height: 40 }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} width={40} height={40} className="object-cover w-full h-full" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="9" r="4" />
            <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0 justify-center">
        <p className="typo-h6 text-surface-950 truncate">{name}</p>
        {salonName && (
          <p className="typo-caption text-surface-600 truncate">{salonName}</p>
        )}
      </div>

      {/* Button — navigate only, conversation created on first message */}
      <Link
        href={`/chat/new/${designerId}`}
        className="shrink-0 flex items-center justify-center gap-2 bg-surface-800 text-white typo-button rounded-lg px-4 py-3 whitespace-nowrap"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.5 13.0714H13.0714V19.5H10.9286V13.0714H4.5V10.9286H10.9286V4.5H13.0714V10.9286H19.5V13.0714Z" />
        </svg>
        Start Conversation
      </Link>
    </div>
  );
}
