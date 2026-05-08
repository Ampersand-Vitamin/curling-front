// Design Ref: §4.20, DS-12 — designer-detail
//
// storage URL이 404거나 src 가 null이면 정적 SVG 플레이스홀더로 fallback.
// next/image 미사용 (NFR-05): remotePatterns 도입은 별도 PDCA.

"use client";

import { useState, useEffect } from "react";
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
  profile: "asset/placeholder/profile.svg",
  portfolio: "asset/placeholder/portfolio.svg",
};

export default function SafeImage({
  src,
  alt,
  fallback = "portfolio",
  className,
  width,
  height,
}: Props) {
  const [errored, setErrored] = useState(false);

  // src 가 변경되면 errored 리셋 (캐러셀 슬라이드 전환 시 이전 에러 잔류 방지)
  useEffect(() => {
    setErrored(false);
  }, [src]);

  const finalUrl =
    errored || !src
      ? storageUrl(PLACEHOLDER_PATH[fallback])
      : storageUrl(src);

  return (
    <img
      src={finalUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
