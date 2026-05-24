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
 * 2-column interleaved grid (좌→우 교차 배치).
 * CSS columns 가 아닌 수동 split — 아이템이 좌→우→좌→우 순서로 배치되어
 * 결과 변경 시 양쪽 컬럼 모두 시각적으로 업데이트됨.
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

  // 중복 id 제거 (loadMore offset 겹침 또는 RPC 결과 중복 방어)
  const uniqueCards = cards.filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i,
  );

  // 빈 결과 + 로딩 중: 중앙 spinner (초기 검색 / 결과 0건 케이스)
  if (uniqueCards.length === 0 && isLoading) {
    return (
      <div className="px-4 py-16 w-full flex items-center justify-center">
        <GridSpinner />
      </div>
    );
  }

  if (uniqueCards.length === 0 && !isLoading) {
    return (
      <div className="px-4 py-10 w-full text-center typo-body2 text-surface-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 w-full">
      {/* 좌→우 교차 배치: 홀수 idx 왼쪽, 짝수 idx 오른쪽 */}
      <div
        className={`flex gap-2 transition-opacity ${
          isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
        }`}
        aria-busy={isLoading}
      >
        <div className="flex-1 flex flex-col gap-2">
          {uniqueCards.filter((_, i) => i % 2 === 0).map((card) => (
            <PortfolioCard key={card.id} card={card} onFavoriteClick={onFavoriteClick} />
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {uniqueCards.filter((_, i) => i % 2 === 1).map((card) => (
            <PortfolioCard key={card.id} card={card} onFavoriteClick={onFavoriteClick} />
          ))}
        </div>
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
