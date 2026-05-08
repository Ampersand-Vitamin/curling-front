"use client";
// Design Ref: §4.3, §2.1 Page Layer — 모든 client state 보유
// Plan FR-03, FR-09, SC-14
import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import SearchHeader from "./components/SearchHeader";
import PullBar, { type PullBarVariant } from "./components/PullBar";
import FilterPopup from "./components/FilterPopup";
import DesignerCard from "./components/DesignerCard";
import SalonCard from "./components/SalonCard";
import { storageUrl } from "@/lib/storage";
import { getDesignersBySalon } from "@/lib/designers";
import type { DiscoverMode } from "@/types/discover";
import type { FilterSection } from "@/types/keyword";
import type { Salon } from "@/types/salon";
import type { DesignerMapItem, DesignerListItem } from "@/lib/designers";

interface DiscoverClientProps {
  filterSections: FilterSection[];
  salons: Salon[];
  designerMapItems: DesignerMapItem[];
  designers: DesignerListItem[];
}

export default function DiscoverClient({ filterSections, salons, designerMapItems, designers }: DiscoverClientProps) {
  // Plan FR-09: slug 기반 Set. SearchHeader quick-filter는 Recommended PDCA에서 교체 예정이라
  // 현재는 label을 홀드할 수도 있으나 FilterPopup은 slug만 사용.
  const [activeKeywords, setActiveKeywords] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [mode, setMode] = useState<DiscoverMode>("salon");
  const [pullBarVariant, setPullBarVariant] = useState<PullBarVariant>("compact");
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  // 모드 전환 시 핀 선택 해제
  useEffect(() => {
    setSelectedPinId(null);
  }, [mode]);

  const isPinSelected = selectedPinId !== null;

  // 선택된 살롱 (모드 무관)
  // TODO: salon 모드 → salon.imageUrl (DB 스키마에 살롱 이미지 필드 추가 필요)
  const selectedSalon =
    selectedPinId?.startsWith("salon:")
      ? salons.find((s) => s.id === selectedPinId.slice("salon:".length)) ?? null
      : null;
  const selectedDesignerSalon =
    selectedPinId?.startsWith("designer:")
      ? designerMapItems.find(
          (d) => d.salonId === selectedPinId.slice("designer:".length),
        ) ?? null
      : null;

  // 디자이너 핀 클릭 시 해당 살롱 디자이너 on-demand fetch + 캐시
  const [designersBySalon, setDesignersBySalon] = useState<
    Record<string, DesignerListItem[]>
  >({});
  const [loadingSalonId, setLoadingSalonId] = useState<string | null>(null);

  useEffect(() => {
    const salonId = selectedDesignerSalon?.salonId;
    if (!salonId || designersBySalon[salonId]) return;
    let cancelled = false;
    setLoadingSalonId(salonId);
    getDesignersBySalon(salonId)
      .then((list) => {
        if (cancelled) return;
        setDesignersBySalon((prev) => ({ ...prev, [salonId]: list }));
      })
      .catch((err) => console.warn("[DiscoverClient] getDesignersBySalon", err))
      .finally(() => {
        if (!cancelled) setLoadingSalonId((id) => (id === salonId ? null : id));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDesignerSalon, designersBySalon]);

  const selectedSalonDesigners = selectedDesignerSalon
    ? designersBySalon[selectedDesignerSalon.salonId] ?? []
    : [];
  const isSelectedSalonLoading =
    selectedDesignerSalon !== null &&
    loadingSalonId === selectedDesignerSalon.salonId;

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
          selectedPinId={selectedPinId}
          onPinSelect={setSelectedPinId}
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

        {/* 핀 선택 시 — 확장 카드 (PullBar handle 위에 띄움)
            Figma Ref: 639:113341 BottomArea (popup-designer / popup-salon) */}
        {isPinSelected && (
          <div className="flex flex-col gap-2 px-4 py-2.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => setSelectedPinId(null)}
              aria-label="close"
              className="self-start flex items-center justify-center p-2 rounded-full backdrop-blur-sm bg-surface-950/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/cancel.svg"
                alt=""
                width={12}
                height={12}
                className="[filter:brightness(0)_invert(1)]"
              />
            </button>

            {selectedDesignerSalon && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                {isSelectedSalonLoading &&
                  selectedSalonDesigners.length === 0 && (
                    <p className="typo-body2 text-surface-500 px-1 py-2">
                      불러오는 중...
                    </p>
                  )}
                {!isSelectedSalonLoading &&
                  selectedSalonDesigners.length === 0 && (
                    <p className="typo-body2 text-surface-500 px-1 py-2">
                      이 살롱의 디자이너 정보가 아직 없어요
                    </p>
                  )}
                {selectedSalonDesigners.map((d) => (
                  <DesignerCard
                    key={d.id}
                    id={d.id}
                    name={d.displayName}
                    role={d.role}
                    languages={d.languages}
                    profileImage={
                      d.profileImageUrl ? storageUrl(d.profileImageUrl) : ""
                    }
                    portfolioImage={
                      d.portfolioImages[0]
                        ? storageUrl(d.portfolioImages[0])
                        : ""
                    }
                    size="large"
                  />
                ))}
              </div>
            )}

            {selectedSalon && (
              // TODO: Salon 타입에 imageUrl, distanceLabel 추가
              <SalonCard
                id={selectedSalon.id}
                name={selectedSalon.name}
                address={selectedSalon.address}
              />
            )}
          </div>
        )}

        {/* 하단 PullBar — 핀 선택 시 collapsed로 강제 */}
        <div className="pointer-events-auto">
          <PullBar
            designers={designers}
            forceCollapsed={showFilter || isPinSelected}
            onVariantChange={setPullBarVariant}
          />
        </div>
      </div>
    </div>
  );
}
