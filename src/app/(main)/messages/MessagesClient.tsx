"use client";

import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import type { ConversationItem } from "@/types/message";

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ConversationRow({ item }: { item: ConversationItem }) {
  return (
    <Link
      href={`/messages/${item.id}`}
      className="flex items-center gap-3 px-4 py-3 active:bg-surface-100 transition-colors"
    >
      {/* Avatar */}
      <div className="size-12 rounded-full overflow-hidden bg-surface-200 shrink-0">
        <SafeImage
          src={item.designerProfileImage}
          alt={item.designerName}
          fallback="profile"
          className="size-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="typo-body1 text-surface-950 font-medium truncate">
            {item.designerName}
          </p>
          <span className="typo-caption text-surface-400 shrink-0">
            {formatTime(item.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="typo-body2 text-surface-500 truncate">
            {item.lastMessage ?? "No messages yet"}
          </p>
          {item.unreadCount > 0 && (
            <span className="shrink-0 size-5 rounded-full bg-secondary-400 text-white flex items-center justify-center text-[11px] font-medium">
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
      <div className="size-16 rounded-full bg-surface-100 flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-surface-400"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="typo-body1 text-surface-600 font-medium">
          No messages yet
        </p>
        <p className="typo-body2 text-surface-400 mt-1">
          Start a conversation with a designer
        </p>
      </div>
    </div>
  );
}

export default function MessagesClient({
  conversations,
}: {
  conversations: ConversationItem[];
}) {
  if (conversations.length === 0) {
    return (
      <div className="bg-white min-h-full flex flex-col">
        <div className="sticky top-0 bg-white z-10 pt-16 pb-[10px]">
          <p className="typo-h6 text-surface-600 text-center">Messages</p>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-full flex flex-col">
      {/* Sticky header — 다른 탭과 동일 패턴 */}
      <div className="sticky top-0 bg-white z-10 pt-16 pb-[10px]">
        <p className="typo-h6 text-surface-600 text-center">Messages</p>
      </div>

      {/* Conversation list */}
      <div className="flex flex-col">
        {conversations.map((item) => (
          <ConversationRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
