"use client";

import { FavoriteDesignerItem } from "@/components/chat/FavoriteDesignerItem";
import { RecentChatItem } from "@/components/chat/RecentChatItem";
import { StartConversationRow } from "@/components/chat/StartConversationRow";
import type { ConversationItem } from "@/types/message";
import type { SuggestedDesigner } from "./page";

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
  suggestedDesigners = [],
}: {
  conversations: ConversationItem[];
  suggestedDesigners?: SuggestedDesigner[];
}) {
  if (conversations.length === 0) {
    return (
      <div className="bg-white min-h-full flex flex-col">
        <div className="sticky top-0 bg-white z-10 pt-16 pb-[10px]">
          <p className="typo-h6 text-surface-600 text-center">Messages</p>
        </div>
        <EmptyState />
        {suggestedDesigners.length > 0 && (
          <div className="px-4 pb-6">
            <p className="typo-body2 text-surface-500 font-medium mb-2">
              Start a new conversation
            </p>
            <div className="flex flex-col gap-3">
              {suggestedDesigners.map((d) => (
                <StartConversationRow
                  key={d.id}
                  designerId={d.id}
                  name={d.displayName}
                  salonName={d.salonName ?? ""}
                  avatarUrl={d.profileImageUrl}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white min-h-full flex flex-col">
      <div className="sticky top-0 bg-white z-10 pt-16 pb-[10px]">
        <p className="typo-h6 text-surface-600 text-center">Messages</p>
      </div>

      {/* Favorite designers — horizontal scroll */}
      {conversations.length > 0 && (
        <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
          {conversations.map((item) => (
            <FavoriteDesignerItem
              key={item.id}
              designerId={item.designerId}
              name={item.designerName}
              avatarUrl={item.designerProfileImage}
            />
          ))}
        </div>
      )}

      {/* Conversation list */}
      <div className="flex flex-col gap-1 px-4">
        {conversations.map((item) => (
          <RecentChatItem
            key={item.id}
            conversationId={item.id}
            name={item.designerName}
            salonName=""
            avatarUrl={item.designerProfileImage}
            lastMessage={item.lastMessage ?? "No messages yet"}
            timeLabel={formatTime(item.lastMessageAt)}
            hasNew={item.unreadCount > 0}
          />
        ))}
      </div>

      {/* Suggested designers */}
      {suggestedDesigners.length > 0 && (
        <div className="mt-4 px-4 pb-6">
          <p className="typo-body2 text-surface-500 font-medium mb-2">
            Start a new conversation
          </p>
          <div className="flex flex-col gap-3">
            {suggestedDesigners.map((d) => (
              <StartConversationRow
                  key={d.id}
                  designerId={d.id}
                  name={d.displayName}
                  salonName={d.salonName ?? ""}
                  avatarUrl={d.profileImageUrl}
                />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
