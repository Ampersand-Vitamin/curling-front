// Design Ref: §4.10, §6.3, FR-07, FR-08 — designer-detail
//
// 프로필 썸네일 + 이름·살롱·별점 + 태그라인 + bio (HighlightBubble 통합)

"use client";

import { useState } from "react";
import SafeImage from "@/components/SafeImage";
import type { DesignerDetail } from "@/lib/designers";

function StarBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

interface Props {
  designer: DesignerDetail;
}

export default function DesignerInfoSection({ designer }: Props) {
  const [expanded, setExpanded] = useState(false);
  const formattedReviews = designer.reviewCount.toLocaleString();
  const salonName = designer.salon?.name;

  return (
    <section className="px-4 py-4 border-b border-surface-100">
      {/* 프로필 행: 아바타 + 이름/살롱 + 별점 뱃지 */}
      <div className="flex items-center gap-3">
        <div className="size-[50px] rounded-full overflow-hidden bg-surface-300 shrink-0">
          <SafeImage
            src={designer.profileImageUrl}
            alt={designer.displayName}
            fallback="profile"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="typo-h3 text-surface-950">{designer.displayName}</h1>
          {salonName && (
            <span className="typo-body2 text-surface-500">{salonName}</span>
          )}
        </div>

        {designer.reviewCount > 0 && (
          <div className="flex flex-col items-center shrink-0">
            <div className="size-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-400">
              <StarBadge />
            </div>
            <span className="typo-caption2 text-surface-500 mt-0.5">
              {formattedReviews}
            </span>
          </div>
        )}
      </div>

      {/* 태그라인 (highlightMessage) */}
      {designer.highlightMessage && (
        <p className="typo-h5 text-surface-950 mt-4">
          {designer.highlightMessage}
        </p>
      )}

      {/* Bio */}
      {designer.bio && (
        <div className="mt-2">
          <p className={`typo-body2 text-surface-600 ${expanded ? "" : "line-clamp-2"}`}>
            {designer.bio}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="typo-caption text-surface-400 underline mt-1"
          >
            {expanded ? "close" : "view all"}
          </button>
        </div>
      )}
    </section>
  );
}
