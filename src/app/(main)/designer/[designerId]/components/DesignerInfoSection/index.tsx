"use client";

import { useState } from "react";
import SafeImage from "@/components/SafeImage";
import FavoriteButton from "@/components/ui/FavoriteButton";
import type { DesignerDetail } from "@/lib/designers";

interface Props {
  designer: DesignerDetail;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function DesignerInfoSection({ designer, isFavorite, onToggleFavorite }: Props) {
  const [expanded, setExpanded] = useState(false);
  const formattedReviews = designer.reviewCount.toLocaleString();
  const salonName = designer.salon?.name;

  return (
    <section className="flex flex-col gap-4">
      {/* 프로필 행: 아바타 + 이름/살롱 + 즐겨찾기 */}
      <div className="flex items-center gap-4">
        <div className="size-[60px] rounded-full overflow-hidden bg-surface-300 shrink-0">
          <SafeImage
            src={designer.profileImageUrl}
            alt={designer.displayName}
            fallback="profile"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="typo-h2 text-surface-950">{designer.displayName}</h1>
          {salonName && (
            <span className="typo-body1 text-surface-600">{salonName}</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0">
          <FavoriteButton
            virant={48}
            status={isFavorite ? "Active" : "Default"}
            onClick={onToggleFavorite}
          />
          {designer.reviewCount > 0 && (
            <span className="typo-caption text-surface-600">
              {formattedReviews}
            </span>
          )}
        </div>
      </div>

      {/* 태그라인 + bio */}
      <div className="flex flex-col gap-2">
        {designer.highlightMessage && (
          <p className="typo-h5 text-surface-800">{designer.highlightMessage}</p>
        )}
        {designer.bio && (
          <>
            <p className={`typo-body2 text-surface-600 ${expanded ? "" : "line-clamp-2"}`}>
              {designer.bio}
            </p>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="typo-caption text-surface-400 underline self-start"
            >
              {expanded ? "close" : "view all"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
