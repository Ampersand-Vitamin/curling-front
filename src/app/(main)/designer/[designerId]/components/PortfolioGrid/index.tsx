"use client";

import Link from "next/link";
import SafeImage from "@/components/SafeImage";

interface PortfolioItem {
  id: string;
  imageUrl: string;
}

interface Props {
  images?: string[];
  items?: PortfolioItem[];
  limit?: number;
  columns?: 2 | 3;
  onViewMore?: () => void;
  showHeader?: boolean;
}

export default function PortfolioGrid({
  images,
  items,
  limit,
  columns = 2,
  onViewMore,
  showHeader = true,
}: Props) {
  const allItems: PortfolioItem[] = items
    ? items
    : (images ?? []).map((url, i) => ({ id: String(i), imageUrl: url }));

  if (allItems.length === 0) return null;

  const visible = typeof limit === "number" ? allItems.slice(0, limit) : allItems;
  const hasMore = typeof limit === "number" && allItems.length > limit;
  const hasIds = !!items;

  const gridClass = columns === 3 ? "grid-cols-3 gap-0.5" : "grid-cols-2 gap-1";

  return (
    <div>
      {showHeader && (
        <h2 className="typo-h4 text-surface-950 mb-3">Portfolio</h2>
      )}
      <div className={`grid ${gridClass}`}>
        {visible.map((item) => {
          const card = (
            <div className="bg-surface-100 overflow-hidden rounded-2xl" style={{ height: 200 }}>
              <SafeImage
                src={item.imageUrl}
                alt="Portfolio"
                fallback="portfolio"
                className="w-full h-full object-cover"
              />
            </div>
          );
          return hasIds ? (
            <Link key={item.id} href={`/portfolio/${item.id}`}>
              {card}
            </Link>
          ) : (
            <div key={item.id}>{card}</div>
          );
        })}
      </div>
      {hasMore && onViewMore && (
        <button
          type="button"
          onClick={onViewMore}
          className="mt-3 w-full py-3 bg-surface-200 rounded-lg typo-button text-surface-950 active:bg-surface-300"
        >
          View More
        </button>
      )}
    </div>
  );
}
