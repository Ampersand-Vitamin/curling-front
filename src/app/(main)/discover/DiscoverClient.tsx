"use client";
// Design Ref: §4.3, §2.1 Page Layer — 모든 client state 보유
// Plan FR-03, FR-09, SC-14
import { useState } from "react";
import MapView from "./components/MapView";
import SearchHeader from "./components/SearchHeader";
import PullBar, { type PullBarVariant } from "./components/PullBar";
import FilterPopup from "./components/FilterPopup";
import type { DiscoverMode } from "@/types/discover";
import type { FilterSection } from "@/types/keyword";
import type { Salon } from "@/types/salon";
import type { DesignerMapItem } from "@/lib/designers";

interface DiscoverClientProps {
  filterSections: FilterSection[];
  salons: Salon[];
  designerMapItems: DesignerMapItem[];
}

export default function DiscoverClient({ filterSections, salons, designerMapItems }: DiscoverClientProps) {
  // Plan FR-09: slug 기반 Set. SearchHeader quick-filter는 Recommended PDCA에서 교체 예정이라
  // 현재는 label을 홀드할 수도 있으나 FilterPopup은 slug만 사용.
  const [activeKeywords, setActiveKeywords] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [mode, setMode] = useState<DiscoverMode>("salon");
  const [pullBarVariant, setPullBarVariant] = useState<PullBarVariant>("compact");

  // PullBar expanded 상태 && 필터 팝업 닫힌 상태 → SearchHeader 숨김 (pullbar가 그만큼 올라옴)
  const hideSearchHeader = pullBarVariant === "expanded" && !showFilter;

  // Design Ref: §2.2 DS-4 — toggle과 remove를 별도 핸들러로 노출
  const toggleKeyword = (key: string) => {
    setActiveKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Plan FR-14 — Selected 섹션의 X 버튼용
  const removeKeyword = (slug: string) => {
    setActiveKeywords((prev) => {
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  };

  return (
    <div className="relative h-[calc(100dvh-76px)]">
      {/* 지도 — 배경 */}
      <div className="absolute inset-0">
        <MapView
          mode={mode}
          salons={salons}
          designerMapItems={designerMapItems}
          pullBarVariant={pullBarVariant}
        />
      </div>

      {/* 블러 오버레이 */}
      {showFilter && (
        <>
          <div className="absolute inset-0 backdrop-blur-sm z-10" />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-surface-950/30 via-surface-950/70 to-surface-950/80" />
        </>
      )}

      {/* UI 레이어 — flex column */}
      <div className="relative z-20 flex flex-col h-full pointer-events-none">
        {/* 검색 헤더 — PullBar expanded 시 숨김 */}
        {!hideSearchHeader && (
          <div className="pt-4 pointer-events-auto">
            <SearchHeader
              activeKeywords={activeKeywords}
              showFilter={showFilter}
              mode={mode}
              onToggleKeyword={toggleKeyword}
              onFilterPress={() => setShowFilter(true)}
              onFilterClose={() => setShowFilter(false)}
              onToggleMode={() => setMode((prev) => (prev === "salon" ? "designer" : "salon"))}
            />
          </div>
        )}

        {/* 중간 영역 — 필터 팝업 또는 빈 공간 */}
        <div className={`flex-1 min-h-0 py-3 px-3 ${showFilter ? "pointer-events-auto" : ""}`}>
          {showFilter && (
            <FilterPopup
              filterSections={filterSections}
              activeKeywords={activeKeywords}
              onToggle={toggleKeyword}
              onRemove={removeKeyword}
              onClose={() => setShowFilter(false)}
            />
          )}
        </div>

        {/* 하단 PullBar */}
        <div className="pointer-events-auto">
          <PullBar
            forceCollapsed={showFilter}
            onVariantChange={setPullBarVariant}
          />
        </div>
      </div>
    </div>
  );
}
