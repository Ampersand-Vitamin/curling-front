import Image from "next/image";
import Link from "next/link";

type Props = {
  designerId: string;
  name: string;
  avatarUrl: string | null;
};

export function FavoriteDesignerItem({ designerId, name, avatarUrl }: Props) {
  return (
    <Link
      href={`/designer/${designerId}`}
      className="flex flex-col items-center gap-2 w-[60px] shrink-0"
    >
      <div
        className="rounded-full overflow-hidden shrink-0 border border-surface-400 bg-surface-200 text-surface-500 flex items-center justify-center"
        style={{ width: 60, height: 60 }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} width={60} height={60} className="object-cover w-full h-full" />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="9" r="4" />
            <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
          </svg>
        )}
      </div>
      <p className="typo-body2 text-surface-950 text-center w-full truncate">{name}</p>
    </Link>
  );
}
