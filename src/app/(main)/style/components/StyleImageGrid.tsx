"use client";

import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import type { StyleImage } from "@/types/styleTab";

function ImageCard({ image }: { image: StyleImage }) {
  return (
    <Link
      href={`/designer/${image.designerId}`}
      className="relative block w-full overflow-hidden rounded-2xl"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.imageUrl}
        alt={`${image.designerName} 스타일`}
        loading="lazy"
        className="w-full h-auto block"
      />
      <div className="absolute inset-x-0 bottom-0 px-2 pt-6 pb-2 bg-gradient-to-t from-surface-950/80 via-surface-950/40 to-transparent">
        <div className="flex items-end gap-1.5">
          <SafeImage
            src={image.profileImageUrl ?? null}
            alt=""
            fallback="profile"
            className="size-7 rounded-full object-cover shrink-0 bg-surface-300"
          />
          <div className="flex-1 min-w-0">
            <p className="typo-body2 text-white truncate">{image.designerName}</p>
            {image.salonName && (
              <p className="typo-caption2 text-white/80 truncate">{image.salonName}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

interface StyleImageGridProps {
  images: StyleImage[];
  isLoading?: boolean;
}

export default function StyleImageGrid({
  images,
  isLoading = false,
}: StyleImageGridProps) {
  if (isLoading) {
    return (
      <div className="px-4 py-16 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="px-4 py-10 text-center typo-body2 text-surface-500">
        해당 스타일의 사진이 없습니다
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-2">
          {images
            .filter((_, i) => i % 2 === 0)
            .map((image) => (
              <ImageCard key={image.id} image={image} />
            ))}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {images
            .filter((_, i) => i % 2 === 1)
            .map((image) => (
              <ImageCard key={image.id} image={image} />
            ))}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 20 20"
      fill="none"
      aria-label="불러오는 중"
      role="status"
      className="animate-spin text-surface-700"
    >
      <circle
        cx="10"
        cy="10"
        r="7.5"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
