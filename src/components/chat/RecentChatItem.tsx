import Link from "next/link";
import SafeImage from "@/components/SafeImage";

type Props = {
  conversationId: string;
  name: string;
  salonName: string;
  avatarUrl: string | null;
  lastMessage: string;
  timeLabel: string;
  hasNew: boolean;
};

export function RecentChatItem({
  conversationId,
  name,
  salonName,
  avatarUrl,
  lastMessage,
  timeLabel,
  hasNew,
}: Props) {
  return (
    <Link
      href={`/messages/${conversationId}`}
      className="flex items-center gap-[10px] w-full py-3"
    >
      {/* Avatar — 40px circle */}
      <div className="size-10 rounded-full overflow-hidden shrink-0 border border-surface-400 bg-surface-200">
        <SafeImage
          src={avatarUrl}
          alt={name}
          fallback="profile"
          className="size-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0 gap-[5px]">
        <div className="flex items-center gap-2 overflow-hidden">
          <p className="typo-h6 text-surface-950 shrink-0">{name}</p>
          {salonName && (
            <p className="typo-caption text-surface-600 truncate">{salonName}</p>
          )}
        </div>
        <div className="flex items-center gap-2 w-full">
          <p className="typo-caption text-surface-800 flex-1 min-w-0 truncate">{lastMessage}</p>
          <p className="typo-caption2 text-surface-400 shrink-0 whitespace-nowrap">{timeLabel}</p>
        </div>
      </div>

      {/* New badge */}
      {hasNew && (
        <div className="shrink-0 bg-primary-400 rounded-2xl px-2 py-1">
          <p className="typo-caption text-white">New</p>
        </div>
      )}
    </Link>
  );
}
