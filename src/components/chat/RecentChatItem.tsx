import Image from "next/image";
import Link from "next/link";

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
      href={`/chat/${conversationId}`}
      className="flex items-center gap-[10px] w-full py-3"
    >
      {/* Avatar — 40px circle */}
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

      {/* Info — flex-1 */}
      <div className="flex flex-col flex-1 min-w-0 gap-[5px]">

        {/* 디자이너명 + 살롱명 row (items-end, gap-2) */}
        <div className="flex items-center gap-2 overflow-hidden">
          <p className="typo-h6 text-surface-950 shrink-0">{name}</p>
          {salonName && (
            <p className="typo-caption text-surface-600 truncate">{salonName}</p>
          )}
        </div>

        {/* 마지막 메시지 + 시간 row */}
        <div className="flex items-center gap-2 w-full">
          <p className="typo-caption text-surface-800 flex-1 min-w-0 truncate">{lastMessage}</p>
          <p className="typo-caption2 text-surface-400 shrink-0 whitespace-nowrap">{timeLabel}</p>
        </div>

      </div>

      {/* New 뱃지 */}
      {hasNew && (
        <div className="shrink-0 bg-primary-400 rounded-2xl px-2 py-1">
          <p className="typo-caption text-white">New</p>
        </div>
      )}
    </Link>
  );
}
