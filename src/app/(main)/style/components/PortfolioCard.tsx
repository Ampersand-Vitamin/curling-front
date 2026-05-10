"use client";

import Link from "next/link";
import type { StylePortfolioCard } from "@/types/style";

interface PortfolioCardProps {
  card: StylePortfolioCard;
  onFavoriteClick?: (id: string) => void;
}

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 3.5h10v13l-5-3-5 3v-13z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export default function PortfolioCard({ card, onFavoriteClick }: PortfolioCardProps) {
  return (
    <Link
      href={`/designer/${card.id}`}
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
        className="absolute top-2 right-2 flex items-center justify-center size-8 rounded-full bg-surface-950/30 backdrop-blur-md text-white"
      >
        <BookmarkIcon filled={card.isFavorited} />
      </button>

      <div className="absolute inset-x-0 bottom-0 px-2 pt-4 pb-2 bg-gradient-to-t from-surface-950/80 via-surface-950/40 to-transparent">
        <div className="flex items-end gap-2">
          {card.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.profileImageUrl}
              alt=""
              aria-hidden="true"
              className="size-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="size-8 rounded-full bg-surface-300 shrink-0" />
          )}
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
