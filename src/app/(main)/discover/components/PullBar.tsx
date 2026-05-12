// Design Ref: §3.1 — Pull Bar 컨테이너 (드래그 핸들로 3단계 전환)
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import DesignerCarousel from "./DesignerCarousel";
import SalonCarousel, { type SalonCarouselItem } from "./SalonCarousel";
import type { LatLng } from "@/lib/geo";
import type { DesignerListItem } from "@/lib/designers";

export type PullBarVariant = "collapsed" | "compact" | "expanded";

// 부모 h-[calc(100dvh-76px)] - 핸들(~24px) - 상단 패딩(20px) 만큼을 expanded가 차지
const BOTTOM_NAV_HEIGHT = 76;
const HANDLE_HEIGHT = 24;
const TOP_PADDING = 20;
const EXPANDED_FALLBACK = 600;

export interface KeywordSection {
  /** keyword slug — key 용 */
  slug: string;
  title: string;
  designers: DesignerListItem[];
}

export interface SalonKeywordSection {
  slug: string;
  title: string;
  items: SalonCarouselItem[];
}

interface PullBarProps {
  /** "Best Match for you" 섹션 디자이너 (recommend placeholder).
   *  빈 배열이면 섹션 자체 숨김 — 필터 적용 시 키워드 섹션만 노출되는 케이스. */
  designers: DesignerListItem[];
  /** 활성 키워드별 OR 매칭 디자이너 섹션 목록 */
  keywordSections?: KeywordSection[];
  /** 활성 키워드별 OR 매칭 살롱 섹션 목록 */
  salonSections?: SalonKeywordSection[];
  /** 사용자 현재 위치 — 각 캐러셀 거리 정렬에 사용 */
  userLocation?: LatLng | null;
  forceCollapsed?: boolean;
  /** 사용자 드래그 변경 시 호출 (controlled — variant prop이 단일 진실 공급원) */
  onVariantChange?: (variant: PullBarVariant) => void;
  /** controlled variant. 미지정 시 내부 state 사용 */
  variant?: PullBarVariant;
}

export default function PullBar({
  designers,
  keywordSections,
  salonSections,
  userLocation = null,
  forceCollapsed = false,
  onVariantChange,
  variant: variantProp,
}: PullBarProps) {
  const [variantState, setVariantState] = useState<PullBarVariant>("compact");
  const variant = variantProp ?? variantState;
  const setVariant = useCallback(
    (next: PullBarVariant) => {
      if (variantProp === undefined) setVariantState(next);
      onVariantChange?.(next);
    },
    [variantProp, onVariantChange],
  );
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
          className="bg-white"
          style={{
            height: contentHeight,
            overflowY: isDragging ? "hidden" : "auto",
            transition: isDragging ? "none" : "height 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          <div className="flex flex-col gap-6 px-4 pt-2 pb-20">
            {designers.length > 0 && (
              <DesignerCarousel
                designers={designers}
                userLocation={userLocation}
              />
            )}
            {keywordSections?.map((s) => (
              <DesignerCarousel
                key={`d-${s.slug}`}
                title={s.title}
                designers={s.designers}
                showViewMore
                userLocation={userLocation}
              />
            ))}
            {salonSections?.map((s) => (
              <SalonCarousel
                key={`s-${s.slug}`}
                title={s.title}
                items={s.items}
                showViewMore
                userLocation={userLocation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
