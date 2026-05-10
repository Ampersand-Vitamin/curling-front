"use client";

import { useEffect, useRef } from "react";
import PortfolioCard from "./PortfolioCard";
import type { StylePortfolioCard } from "@/types/style";

interface PortfolioGridProps {
  cards: StylePortfolioCard[];
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  emptyMessage?: string;
  onFavoriteClick?: (id: string) => void;
}

/**
 * CSS columns 기반 2-column masonry.
 * 카드 자체는 `break-inside-avoid` 로 컬럼 사이 분할 방지.
 * 무한 스크롤은 sentinel + IntersectionObserver.
 */
export default function PortfolioGrid({
  cards,
  onLoadMore,
  isLoading,
  hasMore,
  emptyMessage = "No results",
  onFavoriteClick,
}: PortfolioGridProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore || !sentinelRef.current) return;
    const node = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { rootMargin: "200px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [onLoadMore, hasMore]);

  if (cards.length === 0 && !isLoading) {
    return (
      <div className="px-4 py-10 w-full text-center typo-body2 text-surface-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 w-full">
      <div className="columns-2 gap-2 [column-fill:_balance]">
        {cards.map((card) => (
          <PortfolioCard
            key={card.id}
            card={card}
            onFavoriteClick={onFavoriteClick}
          />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {isLoading && (
            <span className="typo-caption text-surface-500">Loading...</span>
          )}
        </div>
      )}
    </div>
  );
}
