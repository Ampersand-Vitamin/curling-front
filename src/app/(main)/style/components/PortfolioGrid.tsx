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

  // 빈 결과 + 로딩 중: 중앙 spinner (초기 검색 / 결과 0건 케이스)
  if (cards.length === 0 && isLoading) {
    return (
      <div className="px-4 py-16 w-full flex items-center justify-center">
        <GridSpinner />
      </div>
    );
  }

  if (cards.length === 0 && !isLoading) {
    return (
      <div className="px-4 py-10 w-full text-center typo-body2 text-surface-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 w-full">
      {/* 카드 있는 상태에서 재검색 중: dim + pointer-events 차단 */}
      <div
        className={`columns-2 gap-2 [column-fill:_balance] transition-opacity ${
          isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
        }`}
        aria-busy={isLoading}
      >
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
          {isLoading && <GridSpinner small />}
        </div>
      )}
    </div>
  );
}

function GridSpinner({ small = false }: { small?: boolean }) {
  const size = small ? 18 : 28;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-label="Loading"
      role="status"
      className="animate-spin text-surface-700"
    >
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path
        d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
