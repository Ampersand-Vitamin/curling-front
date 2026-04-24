"use client";
// Design Ref: §4.6 — Service(treatment) 카테고리 전용 2단계 펼침
// Plan FR-06, FR-07, D-3, SC-04, SC-05
// 그룹 칩 = 펼침 전용 (선택 아님), 하위 키워드 클릭 = activeKeywords 토글
import { useState } from "react";
import KeywordFilter from "./KeywordFilter";
import type { KeywordGroup } from "@/types/keyword";

interface ServiceGroupSectionProps {
  displayName: string;
  groups: KeywordGroup[];
  activeKeywords: Set<string>; // slug set
  onToggle: (slug: string) => void;
}

export default function ServiceGroupSection({
  displayName,
  groups,
  activeKeywords,
  onToggle,
}: ServiceGroupSectionProps) {
  // Design Ref: §2.2 DS-3 — UI-only 로컬 상태. null = 전부 접힘
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Plan D-3 / SC-04: 그룹 탭 클릭은 펼침만, activeKeywords 변화 없음
  const toggleExpand = (groupName: string) => {
    setExpandedGroup((prev) => (prev === groupName ? null : groupName));
  };

  const expanded = groups.find((g) => g.group_name === expandedGroup);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="typo-h6 text-surface-900">{displayName}</h3>

      {/* 그룹 칩 행 */}
      <div className="flex flex-wrap gap-1">
        {groups.map((group) => (
          <KeywordFilter
            key={group.group_name}
            label={group.group_name}
            variant="filled"
            showChevron
            activated={expandedGroup === group.group_name}
            onClick={() => toggleExpand(group.group_name)}
          />
        ))}
      </div>

      {/* 펼쳐진 하위 키워드 행 */}
      {expanded && (
        <div className="flex flex-wrap gap-1 rounded-lg bg-surface-100 p-2">
          {expanded.keywords.map((k) => (
            <KeywordFilter
              key={k.slug}
              label={k.name}
              variant="filled"
              activated={activeKeywords.has(k.slug)}
              onClick={() => onToggle(k.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
