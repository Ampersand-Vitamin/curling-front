import Link from "next/link";
import SafeImage from "@/components/SafeImage";

type Props = {
  designerId: string;
  name: string;
  salonName: string;
  avatarUrl: string | null;
};

export function StartConversationRow({ designerId, name, salonName, avatarUrl }: Props) {
  return (
    <div className="flex items-center gap-[10px] w-full">
      {/* Avatar */}
      <div className="size-10 rounded-full overflow-hidden shrink-0 border border-surface-400 bg-surface-200">
        <SafeImage
          src={avatarUrl}
          alt={name}
          fallback="profile"
          className="size-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0 justify-center">
        <p className="typo-h6 text-surface-950 truncate">{name}</p>
        {salonName && (
          <p className="typo-caption text-surface-600 truncate">{salonName}</p>
        )}
      </div>

      {/* Button */}
      <Link
        href={`/messages/new/${designerId}`}
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
