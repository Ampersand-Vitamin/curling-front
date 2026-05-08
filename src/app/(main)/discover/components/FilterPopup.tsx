"use client";
// Design Ref: §4.4, Plan FR-04, FR-05 — orchestrator, 4카테고리만 DB 기반 렌더
// 하드코딩 FILTER_CATEGORIES 제거 (SC-01)
import KeywordFilter from "./KeywordFilter";
import SelectedKeywordsSection from "./SelectedKeywordsSection";
import ServiceGroupSection from "./ServiceGroupSection";
import type { FilterSection } from "@/types/keyword";

interface FilterPopupProps {
  filterSections: FilterSection[];
  activeKeywords: Set<string>; // slug set
  onToggle: (slug: string) => void;
  onRemove: (slug: string) => void;
  onClose: () => void;
}

export default function FilterPopup({
  filterSections,
  activeKeywords,
  onToggle,
  onRemove,
}: FilterPopupProps) {
  return (
    <div className="h-full overflow-y-auto rounded-2xl bg-surface-50/95 backdrop-blur-[10px] px-[10px] pt-3 pb-5">
      <div className="flex flex-col gap-6">
        {/* Plan FR-12: Selected Keywords 섹션 — 0개면 내부에서 null 반환 */}
        <SelectedKeywordsSection
          filterSections={filterSections}
          activeKeywords={activeKeywords}
          onRemove={onRemove}
        />

        {filterSections.map((section) => (
          <CategoryBlock
            key={section.slug}
            section={section}
            activeKeywords={activeKeywords}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryBlockProps {
  section: FilterSection;
  activeKeywords: Set<string>;
  onToggle: (slug: string) => void;
}

function CategoryBlock({ section, activeKeywords, onToggle }: CategoryBlockProps) {
  // Design Ref: §4.4, Plan FR-06 — treatment만 2단계 그룹핑
  if (section.slug === "treatment" && section.groups) {
    return (
      <ServiceGroupSection
        displayName={section.displayName}
        groups={section.groups}
        activeKeywords={activeKeywords}
        onToggle={onToggle}
      />
    );
  }

  // 일반 카테고리 — 평면 렌더 (languages, hair_type, special_offers)
  return (
    <div className="flex flex-col gap-2">
      <h3 className="typo-h6 text-surface-900">{section.displayName}</h3>
      <div className="flex flex-wrap gap-1">
        {section.keywords?.map((k) => (
          <KeywordFilter
            key={k.slug}
            label={k.name}
            variant="filled"
            activated={activeKeywords.has(k.slug)}
            onClick={() => onToggle(k.slug)}
          />
        ))}
      </div>
    </div>
  );
}
