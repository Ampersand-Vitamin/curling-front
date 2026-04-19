// Design Ref: §3.1 — Pull Bar 컨테이너 (드래그 핸들로 3단계 전환)
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import DesignerCarousel from "./DesignerCarousel";

type PullBarVariant = "collapsed" | "compact" | "expanded";

// 각 variant별 컨텐츠 영역 높이 (px)
const VARIANT_HEIGHTS: Record<PullBarVariant, number> = {
  collapsed: 0,
  compact: 260,
  expanded: 440, //TODO: 하단 내비바 높이만큼 더해줘야 함
};

const SNAP_POINTS = [
  VARIANT_HEIGHTS.collapsed,
  VARIANT_HEIGHTS.compact,
  VARIANT_HEIGHTS.expanded,
];

function getVariantFromHeight(height: number): PullBarVariant {
  if (height <= SNAP_POINTS[0] + (SNAP_POINTS[1] - SNAP_POINTS[0]) / 2)
    return "collapsed";
  if (height <= SNAP_POINTS[1] + (SNAP_POINTS[2] - SNAP_POINTS[1]) / 2)
    return "compact";
  return "expanded";
}

interface PullBarProps {
  forceCollapsed?: boolean;
}

export default function PullBar({ forceCollapsed = false }: PullBarProps) {
  const [variant, setVariant] = useState<PullBarVariant>("compact");
  const [isDragging, setIsDragging] = useState(false);
  const [dragHeight, setDragHeight] = useState(VARIANT_HEIGHTS.compact);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const handleRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      dragStartY.current = e.clientY;
      dragStartHeight.current = VARIANT_HEIGHTS[variant];
      setDragHeight(VARIANT_HEIGHTS[variant]);
      handleRef.current?.setPointerCapture(e.pointerId);
    },
    [variant]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      // 위로 드래그 = clientY 감소 = 높이 증가
      const delta = dragStartY.current - e.clientY;
      const newHeight = Math.max(
        0,
        Math.min(VARIANT_HEIGHTS.expanded, dragStartHeight.current + delta)
      );
      setDragHeight(newHeight);
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    // 가장 가까운 snap point로 전환
    const snapped = getVariantFromHeight(dragHeight);
    setVariant(snapped);
    setDragHeight(VARIANT_HEIGHTS[snapped]);
  }, [isDragging, dragHeight]);

  // variant가 외부에서 바뀔 때 dragHeight 동기화
  useEffect(() => {
    if (!isDragging) {
      setDragHeight(VARIANT_HEIGHTS[variant]);
    }
  }, [variant, isDragging]);

  const contentHeight = forceCollapsed ? 0 : isDragging ? dragHeight : VARIANT_HEIGHTS[variant];
  const showContent = contentHeight > 0;
  const cardSize =
    contentHeight > (VARIANT_HEIGHTS.compact + VARIANT_HEIGHTS.expanded) / 2
      ? "medium"
      : "small";

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
            <DesignerCarousel cardSize={cardSize} />
          </div>
        </div>
      )}

      {/* TODO: full 상태 — column 레이아웃 (디자인 미정) */}
    </div>
  );
}
