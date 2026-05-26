"use client";
// Design Ref: §4.4, Plan FR-04, FR-05 — orchestrator, 4카테고리만 DB 기반 렌더
// 하드코딩 FILTER_CATEGORIES 제거 (SC-01)
import { useState } from "react";
import SearchBar from "@/components/ui/SearchBar";
import KeywordFilter from "./KeywordFilter";
import SelectedKeywordsSection from "./SelectedKeywordsSection";
import ServiceGroupSection from "./ServiceGroupSection";
import { getLanguageFlag } from "@/lib/languageFlag";
import type { FilterSection, Keyword } from "@/types/keyword";

function FlagIcon({ src }: { src: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      className="size-5 rounded-full shrink-0"
    />
  );
}

function MoreIcon() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src="/icons/more.svg" alt="" width={16} height={16} className="shrink-0" />
  );
}

interface FilterPopupProps {
  filterSections: FilterSection[];
  activeKeywords: Set<string>; // slug set
  onToggle: (slug: string) => void;
  onRemove: (slug: string) => void;
  onClose: () => void;
  /** Figma 572:7401 Apply Selected — 미지정 시 onClose 사용 */
  onApply?: () => void;
}

function CloseIcon() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src="/icons/cancel.svg" alt="" width={14} height={14} />
  );
}

export default function FilterPopup({
  filterSections,
  activeKeywords,
  onToggle,
  onRemove,
  onClose,
  onApply,
}: FilterPopupProps) {
  const hasSelection = activeKeywords.size > 0;
  const handleApply = onApply ?? onClose;

  // 팝업 내부 검색 — 외부 헤더 SearchBar는 클릭만(open), 입력은 여기서만 이뤄짐
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  // 검색 모드일 때 — 각 섹션의 keywords/groups를 평면 매칭, 빈 섹션은 숨김
  const matchedSections = isSearching
    ? filterSections
        .map((section) => {
          const flat = section.groups
            ? section.groups.flatMap((g) => g.keywords)
            : (section.keywords ?? []);
          const matches = flat.filter((k) =>
            k.name.toLowerCase().includes(trimmedQuery),
          );
          return { section, matches };
        })
        .filter((entry) => entry.matches.length > 0)
    : null;

  return (
    <div className="h-full flex flex-col rounded-2xl bg-surface-white">
      {/* 헤더 — 닫기 + 검색바 */}
      <div className="shrink-0 px-[10px] pt-3 pb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setQuery("");
            onClose();
          }}
          aria-label="close"
          className="flex items-center justify-center size-[48px] rounded-full shrink-0 bg-surface-200 text-surface-900"
        >
          <CloseIcon />
        </button>
        <SearchBar
          placeholder="Search Keywords"
          variant="muted"
          value={query}
          onChange={setQuery}
          autoFocus
        />
      </div>

      {/* 스크롤 영역 — 카테고리. Figma 572:7319 — 섹션 사이 0.5px top border */}
      <div className="flex-1 min-h-0 overflow-y-auto px-[10px] pb-5">
        {isSearching ? (
          <div className="flex flex-col">
            {matchedSections && matchedSections.length > 0 ? (
              matchedSections.map(({ section, matches }, idx) => (
                <div
                  key={section.slug}
                  className={`pt-2 pb-3 ${idx > 0 ? "border-t-[0.5px] border-surface-200" : ""}`}
                >
                  <FlatBlock
                    sectionSlug={section.slug}
                    displayName={section.displayName}
                    keywords={matches}
                    activeKeywords={activeKeywords}
                    onToggle={onToggle}
                  />
                </div>
              ))
            ) : (
              <p className="pt-6 typo-body2 text-surface-500 text-center">
                No keywords match &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {filterSections.map((section, idx) => (
              <div
                key={section.slug}
                className={`pt-2 pb-3 ${idx > 0 ? "border-t-[0.5px] border-surface-200" : ""}`}
              >
                <CategoryBlock
                  section={section}
                  activeKeywords={activeKeywords}
                  onToggle={onToggle}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Figma 572:7394 — 하단 Selected + Apply 영역. 선택 0개면 숨김 */}
      {hasSelection && (
        <div className="shrink-0 flex flex-col gap-[10px] border-t border-surface-200 bg-surface-white p-[10px] rounded-b-2xl">
          <SelectedKeywordsSection
            filterSections={filterSections}
            activeKeywords={activeKeywords}
            onRemove={onRemove}
            hideHeader
          />
          <button
            type="button"
            onClick={handleApply}
            className="w-full rounded-lg bg-surface-900 text-white typo-h6 py-4 px-8"
          >
            Apply Selected
          </button>
        </div>
      )}
    </div>
  );
}

interface CategoryBlockProps {
  section: FilterSection;
  activeKeywords: Set<string>;
  onToggle: (slug: string) => void;
}

function CategoryBlock({ section, activeKeywords, onToggle }: CategoryBlockProps) {
  // service 카테고리만 group_name 기준 2단계 그룹핑 (Perm/Straightening/Protective/Wigs)
  if (section.slug === "service" && section.groups) {
    return (
      <ServiceGroupSection
        displayName={section.displayName}
        groups={section.groups}
        activeKeywords={activeKeywords}
        onToggle={onToggle}
      />
    );
  }

  // 그 외 카테고리는 tier 기반: tier=1 기본 노출, tier=2는 "More" 안
  if (section.keywords) {
    return (
      <TieredBlock
        sectionSlug={section.slug}
        displayName={section.displayName}
        keywords={section.keywords}
        activeKeywords={activeKeywords}
        onToggle={onToggle}
      />
    );
  }

  return null;
}

interface FlatBlockProps {
  sectionSlug: string;
  displayName: string;
  keywords: Keyword[];
  activeKeywords: Set<string>;
  onToggle: (slug: string) => void;
}

/** 검색 모드용 — tier/group 무시하고 매칭 키워드만 평면 렌더 */
function FlatBlock({
  sectionSlug,
  displayName,
  keywords,
  activeKeywords,
  onToggle,
}: FlatBlockProps) {
  const isLanguages = sectionSlug === "languages";
  return (
    <div className="flex flex-col gap-2">
      <h3 className="typo-h6 text-surface-900">{displayName}</h3>
      <div className="flex flex-wrap gap-1">
        {keywords.map((k) => {
          const flag = isLanguages ? getLanguageFlag(k.slug) : null;
          return (
            <KeywordFilter
              key={k.slug}
              label={k.name}
              variant="filled"
              activated={activeKeywords.has(k.slug)}
              onClick={() => onToggle(k.slug)}
              leadingIcon={flag ? <FlagIcon src={flag} /> : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

interface TieredBlockProps {
  sectionSlug: string;
  displayName: string;
  keywords: Keyword[];
  activeKeywords: Set<string>;
  onToggle: (slug: string) => void;
}

function TieredBlock({
  sectionSlug,
  displayName,
  keywords,
  activeKeywords,
  onToggle,
}: TieredBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const isLanguages = sectionSlug === "languages";

  // tier 1 항상 노출. tier 2는 expanded 또는 선택됐을 때만 노출
  // (선택된 항목이 Tier2여도 활성 상태로 계속 보이도록)
  const visibleKeywords = expanded
    ? keywords
    : keywords.filter((k) => k.tier === 1 || activeKeywords.has(k.slug));

  const hasTier2 = keywords.some((k) => k.tier === 2);
  const hiddenTier2Count = keywords.filter(
    (k) => k.tier === 2 && !activeKeywords.has(k.slug),
  ).length;
  const showToggle = hasTier2 && (expanded ? true : hiddenTier2Count > 0);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="typo-h6 text-surface-900">{displayName}</h3>
      <div className="flex flex-wrap gap-1">
        {visibleKeywords.map((k) => {
          const flag = isLanguages ? getLanguageFlag(k.slug) : null;
          return (
            <KeywordFilter
              key={k.slug}
              label={k.name}
              variant="filled"
              activated={activeKeywords.has(k.slug)}
              onClick={() => onToggle(k.slug)}
              leadingIcon={flag ? <FlagIcon src={flag} /> : undefined}
            />
          );
        })}
        {showToggle && (
          <KeywordFilter
            label={expanded ? "Less" : "More"}
            variant="outlined"
            onClick={() => setExpanded((prev) => !prev)}
            leadingIcon={<MoreIcon />}
          />
        )}
      </div>
    </div>
  );
}
