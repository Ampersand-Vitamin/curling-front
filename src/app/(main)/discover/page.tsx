"use client";

import { useState } from "react";
import MapView from "./components/MapView";
import SearchHeader from "./components/SearchHeader";
import PullBar from "./components/PullBar";
import FilterPopup from "./components/FilterPopup";
import type { DiscoverMode } from "@/types/discover";

export default function DiscoverPage() {
  const [activeKeywords, setActiveKeywords] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [mode, setMode] = useState<DiscoverMode>("salon");

  const toggleKeyword = (keyword: string) => {
    setActiveKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  };

  return (
    <div className="relative h-[calc(100dvh-76px)]">
      {/* 지도 — 배경 */}
      <div className="absolute inset-0">
        <MapView mode={mode} />
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
        {/* 검색 헤더 */}
        <div className="pt-10 pointer-events-auto">
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

        {/* 중간 영역 — 필터 팝업 또는 빈 공간 */}
        <div className={`flex-1 min-h-0 py-3 px-3 ${showFilter ? "pointer-events-auto" : ""}`}>
          {showFilter && (
            <FilterPopup
              activeKeywords={activeKeywords}
              onToggle={toggleKeyword}
              onClose={() => setShowFilter(false)}
            />
          )}
        </div>

        {/* 하단 PullBar */}
        <div className="pointer-events-auto">
          <PullBar forceCollapsed={showFilter} />
        </div>
      </div>
    </div>
  );
}
