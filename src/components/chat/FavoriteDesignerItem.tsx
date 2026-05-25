import Link from "next/link";
import SafeImage from "@/components/SafeImage";

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
      <div className="size-[60px] rounded-full overflow-hidden shrink-0 border border-surface-400 bg-surface-200">
        <SafeImage
          src={avatarUrl}
          alt={name}
          fallback="profile"
          className="size-full object-cover"
        />
      </div>
      <p className="typo-body2 text-surface-950 text-center w-full truncate">{name}</p>
    </Link>
  );
}
