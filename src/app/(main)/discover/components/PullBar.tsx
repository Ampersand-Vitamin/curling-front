// Design Ref: §3.1 — Pull Bar 컨테이너 (드래그 핸들로 3단계 전환)
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import DesignerCarousel from "./DesignerCarousel";
import type { DesignerListItem } from "@/lib/designers";

export type PullBarVariant = "collapsed" | "compact" | "expanded";

// 부모 h-[calc(100dvh-76px)] - 핸들(~24px) - 상단 패딩(20px) 만큼을 expanded가 차지
const BOTTOM_NAV_HEIGHT = 76;
const HANDLE_HEIGHT = 24;
const TOP_PADDING = 20;
const EXPANDED_FALLBACK = 600;

interface PullBarProps {
  designers: DesignerListItem[];
  forceCollapsed?: boolean;
  onVariantChange?: (variant: PullBarVariant) => void;
}

export default function PullBar({ designers, forceCollapsed = false, onVariantChange }: PullBarProps) {
  const [variant, setVariant] = useState<PullBarVariant>("compact");
  const [isDragging, setIsDragging] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // expanded 높이를 뷰포트 기준 동적 계산
  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const VARIANT_HEIGHTS: Record<PullBarVariant, number> = useMemo(
    () => ({
      collapsed: 0,
      compact: 300,
      expanded: viewportHeight
        ? Math.max(400, viewportHeight - BOTTOM_NAV_HEIGHT - HANDLE_HEIGHT - TOP_PADDING)
        : EXPANDED_FALLBACK,
    }),
    [viewportHeight],
  );

  const [dragHeight, setDragHeight] = useState(VARIANT_HEIGHTS.compact);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const handleRef = useRef<HTMLDivElement>(null);

  // variant 변경을 부모에게 전파 (DiscoverClient가 SearchHeader 숨김 처리)
  useEffect(() => {
    onVariantChange?.(variant);
  }, [variant, onVariantChange]);

  const getVariantFromHeight = useCallback(
    (height: number): PullBarVariant => {
      const { collapsed, compact, expanded } = VARIANT_HEIGHTS;
      if (height <= collapsed + (compact - collapsed) / 2) return "collapsed";
      if (height <= compact + (expanded - compact) / 2) return "compact";
      return "expanded";
    },
    [VARIANT_HEIGHTS],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      dragStartY.current = e.clientY;
      dragStartHeight.current = VARIANT_HEIGHTS[variant];
      setDragHeight(VARIANT_HEIGHTS[variant]);
      handleRef.current?.setPointerCapture(e.pointerId);
    },
    [variant, VARIANT_HEIGHTS],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const delta = dragStartY.current - e.clientY;
      const newHeight = Math.max(
        0,
        Math.min(VARIANT_HEIGHTS.expanded, dragStartHeight.current + delta),
      );
      setDragHeight(newHeight);
    },
    [isDragging, VARIANT_HEIGHTS],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const snapped = getVariantFromHeight(dragHeight);
    setVariant(snapped);
    setDragHeight(VARIANT_HEIGHTS[snapped]);
  }, [isDragging, dragHeight, getVariantFromHeight, VARIANT_HEIGHTS]);

  useEffect(() => {
    if (!isDragging) {
      setDragHeight(VARIANT_HEIGHTS[variant]);
    }
  }, [variant, isDragging, VARIANT_HEIGHTS]);

  const contentHeight = forceCollapsed
    ? 0
    : isDragging
      ? dragHeight
      : VARIANT_HEIGHTS[variant];
  const showContent = contentHeight > 0;

  return (
    <div className="flex flex-col rounded-t-2xl overflow-hidden bg-white">
      {/* Handle — 드래그 영역 */}
      <div
        ref={handleRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex justify-center bg-white pt-3 pb-2 cursor-grab active:cursor-grabbing select-none touch-none"
      >
        <div className="w-10 h-1 rounded-full bg-surface-300" />
      </div>

      {/* Content Section — 드래그 중 실시간 높이, 릴리즈 시 스프링 전환 */}
      {showContent && (
        <div
          className="bg-white overflow-hidden"
          style={{
            height: contentHeight,
            transition: isDragging ? "none" : "height 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          <div className="px-4 pt-2 pb-5">
            <DesignerCarousel designers={designers} />
          </div>
        </div>
      )}
    </div>
  );
}
