// Design Ref: §4.15, §6.7, FR-12 — designer-detail
//
// limit 미지정 시 전체. limit 초과 시 "View more" 노출 (onViewMore 핸들러).

"use client";

import SafeImage from "@/components/SafeImage";

interface Props {
  images: string[];
  limit?: number;
  columns?: 2 | 3;
  onViewMore?: () => void;
  /** Designer 탭(섹션 제목 + View more 같이) vs Portfolio 탭(제목 없는 풀 그리드) */
  showHeader?: boolean;
}

export default function PortfolioGrid({
  images,
  limit,
  columns = 2,
  onViewMore,
  showHeader = true,
}: Props) {
  if (images.length === 0) return null;

  const visible = typeof limit === "number" ? images.slice(0, limit) : images;
  const hasMore = typeof limit === "number" && images.length > limit;

  const gridClass = columns === 3 ? "grid-cols-3 gap-0.5" : "grid-cols-2 gap-1";

  return (
    <section className={showHeader ? "px-4 py-5 border-b border-surface-100" : ""}>
      {showHeader && (
        <div className="flex justify-between items-center mb-3">
          <h2 className="typo-h6 text-surface-950">Portfolio</h2>
          {hasMore && onViewMore && (
            <button
              type="button"
              onClick={onViewMore}
              className="inline-flex items-center rounded-full bg-surface-200 px-[10px] py-[6px] typo-caption text-surface-800 active:bg-surface-300"
            >
              View more
            </button>
          )}
        </div>
      )}
      <div className={`grid ${gridClass}`}>
        {visible.map((src, i) => (
          <div key={i} className="aspect-square bg-surface-100 overflow-hidden rounded-2xl">
            <SafeImage
              src={src}
              alt={`Portfolio ${i + 1}`}
              fallback="portfolio"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
