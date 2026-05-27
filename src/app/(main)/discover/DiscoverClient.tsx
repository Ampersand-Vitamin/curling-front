"use client";
// Design Ref: §4.3, §2.1 Page Layer — 모든 client state 보유
// Plan FR-03, FR-09, SC-14
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("./components/MapView"), { ssr: false });
import SearchHeader from "./components/SearchHeader";
import PullBar, {
  type KeywordSection,
  type PullBarVariant,
  type SalonKeywordSection,
} from "./components/PullBar";
import type { SalonCarouselItem } from "./components/SalonCarousel";
import FilterPopup from "./components/FilterPopup";
import DesignerCard from "./components/DesignerCard";
import SalonCard from "./components/SalonCard";
import { storageUrl } from "@/lib/storage";
import type { LatLng } from "@/lib/geo";
import { getDesignersBySalon } from "@/lib/designers";
import { selectDesignerPortfolioImage } from "@/lib/designers/selectPortfolioImage";
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

  // 사용자 위치 — MapView가 geolocation 으로 채워주고, PullBar 거리 정렬과 공유.
  // null이면 DesignerCarousel은 자연 순서로 폴백.
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

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

  // 팝업/핀 선택 시 시각적으로 collapsed로 보고 → SearchHeader 숨김 판정에 반영
  const effectivePullBarVariant =
    showFilter || isPinSelected ? "collapsed" : pullBarVariant;

  // SearchHeader 숨김 조건:
  // - PullBar expanded (필터 닫힌 상태에서 pullbar가 그만큼 올라옴)
  // - 필터 팝업 열림 (팝업 내부 자체 검색바 사용)
  const hideSearchHeader =
    (effectivePullBarVariant === "expanded" && !showFilter) || showFilter;

  // Design Ref: §2.2 DS-4 — toggle과 remove를 별도 핸들러로 노출
  const toggleKeyword = (key: string) => {
    setActiveKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      // 필터 선택 시 PullBar를 compact로 올려서 결과 노출
      if (next.size > 0) setPullBarVariant("compact");
      else setPullBarVariant("collapsed");
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

  // 키워드 메타 (name, categorySlug) 인덱스 — 섹션 타이틀/유효성 검증용
  const keywordIndex = useMemo(() => {
    const map = new Map<string, { name: string; categorySlug: string }>();
    for (const section of filterSections) {
      const flat = section.groups
        ? section.groups.flatMap((g) => g.keywords)
        : (section.keywords ?? []);
      for (const k of flat) {
        map.set(k.slug, { name: k.name, categorySlug: section.slug });
      }
    }
    return map;
  }, [filterSections]);

  // 활성 필터 중 유효한 slug만 (SearchHeader quick-filter label은 제외)
  const filterSlugs = useMemo(() => {
    const result: string[] = [];
    for (const k of activeKeywords) {
      if (keywordIndex.has(k)) result.push(k);
    }
    return result;
  }, [activeKeywords, keywordIndex]);

  // Best Match for you — 필터가 있으면 숨김 (TODO: user 테이블 생기면 personalized recommend).
  // 필터 없을 때만 placeholder 리스트로 노출 (최대 10명).
  const bestMatchDesigners = useMemo(
    () => (filterSlugs.length === 0 ? designers.slice(0, 10) : []),
    [filterSlugs.length, designers],
  );

  // 활성 키워드별 OR 매칭 디자이너 섹션 — 활성 0개면 빈 배열
  const keywordSections = useMemo<KeywordSection[]>(() => {
    return filterSlugs.map((slug) => {
      const info = keywordIndex.get(slug)!;
      const title =
        info.categorySlug === "languages"
          ? `${info.name} Speaking Designers`
          : `${info.name} Designers`;
      const matched = designers.filter((d) =>
        d.keywordSlugs.includes(slug),
      );
      return { slug, title, designers: matched };
    });
  }, [filterSlugs, keywordIndex, designers]);

  // 살롱→keyword union 인덱스. salon_keyword(직접) ∪ 소속 디자이너 keyword(간접).
  // 마이그레이션 코멘트(20260421000005)의 "살롱 제공 서비스는 SalonKeyword ∪
  // 소속 디자이너들의 DesignerKeyword 합집합" 규칙을 클라이언트에서 그대로 구현.
  const salonKeywordIndex = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const s of salons) {
      map.set(s.id, new Set(s.keywordSlugs));
    }
    for (const d of designers) {
      if (!d.salonId) continue;
      const set = map.get(d.salonId);
      if (!set) continue; // 디자이너만 있고 살롱이 없는 케이스는 skip
      for (const slug of d.keywordSlugs) set.add(slug);
    }
    return map;
  }, [salons, designers]);

  // 활성 키워드별 OR 매칭 살롱 섹션.
  // 타이틀: "{name} Near Me" (Figma 608:18876).
  const salonSections = useMemo<SalonKeywordSection[]>(() => {
    return filterSlugs.map((slug) => {
      const info = keywordIndex.get(slug)!;
      const title = `${info.name} Near Me`;
      const matched: SalonCarouselItem[] = salons
        .filter((s) => salonKeywordIndex.get(s.id)?.has(slug))
        .map((salon) => {
          // chips: 현재 활성 필터 중 이 살롱이 보유한 것들 (이름 표시)
          const ownedSlugs = salonKeywordIndex.get(salon.id) ?? new Set();
          const chips = filterSlugs
            .filter((s) => ownedSlugs.has(s))
            .map((s) => ({ slug: s, name: keywordIndex.get(s)!.name }));
          return { salon, chips };
        });
      return { slug, title, items: matched };
    });
  }, [filterSlugs, keywordIndex, salons, salonKeywordIndex]);

  // 팝업 닫을 때:
  //   필터 있음 → compact (필터된 결과 즉시 노출)
  //   필터 없음 → collapsed (기존 동작)
  const closeFilter = () => {
    setShowFilter(false);
    setPullBarVariant(filterSlugs.length > 0 ? "compact" : "collapsed");
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
          userLocation={userLocation}
          onUserLocationChange={setUserLocation}
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
              onFilterClose={closeFilter}
              onToggleMode={() => setMode((prev) => (prev === "salon" ? "designer" : "salon"))}
            />
          </div>
        )}

        {/* 중간 영역 — 필터 팝업 또는 빈 공간 */}
        <div className={`flex-1 min-h-0 py-20 px-3 ${showFilter ? "pointer-events-auto" : ""}`}>
          {showFilter && (
            <FilterPopup
              filterSections={filterSections}
              activeKeywords={activeKeywords}
              onToggle={toggleKeyword}
              onRemove={removeKeyword}
              onClose={closeFilter}
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
                      selectDesignerPortfolioImage(d, filterSlugs)
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
        <div className={`pointer-events-auto ${pullBarVariant === "expanded" ? "absolute inset-x-0 bottom-0" : "mt-auto"}`}>
          <PullBar
            designers={bestMatchDesigners}
            keywordSections={keywordSections}
            salonSections={salonSections}
            userLocation={userLocation}
            forceCollapsed={showFilter || isPinSelected}
            variant={pullBarVariant}
            onVariantChange={setPullBarVariant}
          />
        </div>
      </div>
    </div>
  );
}
