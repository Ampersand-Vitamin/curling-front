"use client";

import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import type { StylePortfolioCard } from "@/types/style";

interface PortfolioCardProps {
  card: StylePortfolioCard;
  onFavoriteClick?: (id: string) => void;
}

export default function PortfolioCard({ card, onFavoriteClick }: PortfolioCardProps) {
  return (
    <Link
      href={`/designer/${card.designerId}`}
      className="relative block w-full overflow-hidden rounded-2xl mb-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.coverImageUrl}
        alt={`${card.displayName} portfolio`}
        loading="lazy"
        className="w-full h-auto block"
      />

      <button
        type="button"
        aria-label={card.isFavorited ? "Remove from saved" : "Save"}
        onClick={(e) => {
          e.preventDefault();
          onFavoriteClick?.(card.id);
        }}
        className="absolute top-2 right-2 flex items-center justify-center size-8 rounded-full bg-surface-white/30 backdrop-blur-sm text-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/bookmark.svg" alt="" width={24} height={24} className="[filter:brightness(0)_invert(1)]" />
      </button>

      <div className="absolute inset-x-0 bottom-0 px-2 pt-4 pb-2 bg-gradient-to-t from-surface-950/80 via-surface-950/40 to-transparent">
        <div className="flex items-end gap-2">
          <SafeImage
            src={card.profileImageUrl}
            alt=""
            fallback="profile"
            className="size-8 rounded-full object-cover shrink-0 bg-surface-300"
          />
          <div className="flex-1 min-w-0">
            <p className="typo-body2 text-white truncate">{card.displayName}</p>
            {card.salonName && (
              <p className="typo-caption2 text-white/80 truncate">{card.salonName}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
