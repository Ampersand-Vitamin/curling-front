// Design Ref: §4.9, §6.2, FR-06 — designer-detail
//
// 포트폴리오 히어로 캐러셀 (embla) + 도트 인디케이터 + ⭐ 저장 버튼.

"use client";

import SafeImage from "@/components/SafeImage";
import { useHeroCarousel } from "./useHeroCarousel";


interface Props {
  images: string[];
  designerName: string;
}

export default function PortfolioHero({ images, designerName }: Props) {
  const slides = images.length > 0 ? images : [null];
  const { emblaRef, selectedIndex, scrollTo, indices } = useHeroCarousel(slides.length);

  return (
    <div className="relative bg-surface-200" style={{ height: 450 }}>
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

      {/* 하단 그라데이션 + 도트 인디케이터 */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center pb-8"
        style={{
          height: 100,
          background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))",
        }}
      >
        {slides.length > 1 && (
          <div className="pointer-events-auto flex gap-1">
            {indices.map((i) => {
              const active = i === selectedIndex;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="size-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: active ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.5)" }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
