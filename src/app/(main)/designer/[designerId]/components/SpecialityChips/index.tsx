// Design Ref: §4.13, §6.6, FR-10 — designer-detail
"use client";

import { useState } from "react";
import KeywordFilter from "@/app/(main)/discover/components/KeywordFilter";
import type { DesignerKeyword } from "@/lib/designers";

const EXPERIENCE_PREVIEW_COUNT = 3;

interface Props {
  keywords: DesignerKeyword[];
}

function MoreIcon() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src="/icons/more.svg" alt="" width={16} height={16} className="shrink-0" />
  );
}

export default function SpecialityChips({ keywords }: Props) {
  const [expanded, setExpanded] = useState(false);
  const specialtyKeywords = keywords.filter((k) => k.relationType === "specialty");
  const experienceKeywords = keywords.filter((k) => k.relationType === "experience");
  const visibleExperienceKeywords = expanded
    ? experienceKeywords
    : experienceKeywords.slice(0, EXPERIENCE_PREVIEW_COUNT);
  const visibleKeywords = [...specialtyKeywords, ...visibleExperienceKeywords];
  const showToggle = experienceKeywords.length > EXPERIENCE_PREVIEW_COUNT;

  if (visibleKeywords.length === 0) return null;

  return (
    <section className="px-4 py-5 border-b border-surface-100">
      <h2 className="typo-h6 text-surface-950 mb-3">Speciality</h2>
      <div className="flex flex-wrap gap-2">
        {visibleKeywords.map((k) => (
          <KeywordFilter
            key={`${k.relationType}:${k.slug}`}
            label={k.name}
            activated={k.relationType === "specialty"}
            variant={k.relationType === "specialty" ? "filled" : "outlined"}
          />
        ))}
        {showToggle && (
          <KeywordFilter
            label={expanded ? "Less" : "More"}
            variant="outlined"
            onClick={() => setExpanded((prev) => !prev)}
            leadingIcon={<MoreIcon />}
          />
        )}
      </div>
    </section>
  );
}
