"use client";
// Design Ref: §4.5 — 상단 Selected Keywords 섹션
// Plan FR-12 ~ FR-16, SC-09 ~ SC-11, D-6
// Figma 374:10503 레이아웃
import KeywordFilter from "./KeywordFilter";
import type { FilterSection, Keyword } from "@/types/keyword";

interface SelectedKeywordsSectionProps {
  filterSections: FilterSection[];
  activeKeywords: Set<string>; // slug set
  onRemove: (slug: string) => void;
}

export default function SelectedKeywordsSection({
  filterSections,
  activeKeywords,
  onRemove,
}: SelectedKeywordsSectionProps) {
  // Plan SC-09 / D-6: 0개면 섹션 자체 숨김
  if (activeKeywords.size === 0) return null;

  // slug → Keyword 매핑을 위해 전 섹션을 평탄화
  // (treatment는 groups, 나머지는 keywords에 있음)
  const allKeywords = filterSections.flatMap<Keyword>((s) =>
    s.groups ? s.groups.flatMap((g) => g.keywords) : (s.keywords ?? []),
  );
  const slugMap = new Map(allKeywords.map((k) => [k.slug, k]));

  // Plan FR-15: Set 삽입 순서 = 유저 선택 순서 유지
  const selected = Array.from(activeKeywords)
    .map((slug) => slugMap.get(slug))
    .filter((k): k is Keyword => !!k);

  // slugMap에 없는 slug(SearchHeader quick-filter의 레거시 label 등)는 그냥 무시
  if (selected.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="typo-h6 text-surface-900">Selected Keywords</h3>
      <div className="flex flex-wrap gap-1">
        {selected.map((k) => (
          <KeywordFilter
            key={k.slug}
            label={k.name}
            variant="filled"
            onRemove={() => onRemove(k.slug)}
          />
        ))}
      </div>
    </div>
  );
}
