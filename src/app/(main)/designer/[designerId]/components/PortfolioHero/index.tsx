// Design Ref: §4.9, §6.2, FR-06 — designer-detail
//
// 포트폴리오 히어로 캐러셀 (embla) + 도트 인디케이터 + ⭐ 저장 버튼.

"use client";

import SafeImage from "@/components/SafeImage";
import { useHeroCarousel } from "./useHeroCarousel";

function StarFilled() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function StarOutline() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  images: string[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  designerName: string;
}

export default function PortfolioHero({
  images,
  isFavorite,
  onToggleFavorite,
  designerName,
}: Props) {
  // 빈 배열 fallback: 단일 placeholder slide
  const slides = images.length > 0 ? images : [null];
  const { emblaRef, selectedIndex, scrollTo, indices } = useHeroCarousel(slides.length);

  return (
    <div className="relative aspect-[3/4] bg-surface-200">
      <div ref={emblaRef} className="overflow-hidden h-full">
        <div className="flex h-full">
          {slides.map((src, i) => (
            <div key={i} className="flex-[0_0_100%] h-full min-w-0">
              <SafeImage
                src={src}
                alt={`${designerName} portfolio ${i + 1}`}
                fallback="portfolio"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ⭐ 저장 (UI-only) */}
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label={isFavorite ? "저장 해제" : "저장"}
        aria-pressed={isFavorite}
        className={`absolute top-4 right-4 size-10 rounded-full bg-surface-white/90 shadow-[0px_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center ${
          isFavorite ? "text-secondary-400" : "text-surface-700"
        }`}
      >
        {isFavorite ? <StarFilled /> : <StarOutline />}
      </button>

      {/* 도트 인디케이터 */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {indices.map((i) => {
            const active = i === selectedIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`size-1.5 rounded-full transition-colors ${
                  active ? "bg-surface-white" : "bg-surface-white/50"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
