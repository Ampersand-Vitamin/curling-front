// Design Ref: §4.20, DS-12 — designer-detail
//
// storage URL이 404거나 src 가 null이면 정적 SVG 플레이스홀더로 fallback.
// next/image 미사용 (NFR-05): remotePatterns 도입은 별도 PDCA.

"use client";

import { useState } from "react";
import { storageUrl } from "@/lib/storage";

type Fallback = "profile" | "portfolio";

type Props = {
  src: string | null | undefined;
  alt: string;
  fallback?: Fallback;
  className?: string;
  width?: number;
  height?: number;
};

const PLACEHOLDER_PATH: Record<Fallback, string> = {
  profile: "/icons/designer.svg",
  portfolio: "/icons/portfolio.svg",
};

function toImageUrl(src: string) {
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/")
  ) {
    return src;
  }
  return storageUrl(src);
}

export default function SafeImage({
  src,
  alt,
  fallback = "portfolio",
  className,
  width,
  height,
}: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const finalUrl = !src || failedSrc === src
    ? PLACEHOLDER_PATH[fallback]
    : toImageUrl(src);

  return (
    <img
      src={finalUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        if (src) setFailedSrc(src);
      }}
    />
  );
}
