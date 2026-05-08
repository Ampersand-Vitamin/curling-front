// Figma Ref: 639:113354 SalonCard 330×160 — 핀 클릭 popup-salon
// 이미지 + 하단 그라디언트 + 살롱명 + 거리(옵션) + 주소
import Link from "next/link";

export interface SalonCardProps {
  id: string;
  name: string;
  address: string;
  imageUrl?: string;
  distanceLabel?: string;
}

export default function SalonCard({
  id,
  name,
  address,
  imageUrl,
  distanceLabel,
}: SalonCardProps) {
  return (
    <Link
      href={`/salon/${id}`}
      prefetch={false}
      className="relative block w-[330px] h-[160px] rounded-2xl overflow-hidden shrink-0 bg-surface-300"
    >
      {imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-surface-200" />
      )}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 px-4 py-2.5 bg-gradient-to-b from-transparent to-surface-950/50">
        <div className="flex flex-col">
          <p className="typo-h6 text-surface-white truncate">{name}</p>
          <div className="flex gap-1 typo-caption text-surface-white/80">
            {distanceLabel && (
              <>
                <span>{distanceLabel}</span>
                <span>|</span>
              </>
            )}
            <span className="truncate">{address}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
