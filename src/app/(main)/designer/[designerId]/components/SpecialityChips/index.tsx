// Design Ref: §4.13, §6.6, FR-10 — designer-detail
// Plan SC-06: treatment 카테고리 키워드만 렌더

import KeywordFilter from "@/app/(main)/discover/components/KeywordFilter";
import type { DesignerKeyword } from "@/lib/designers";

interface Props {
  keywords: DesignerKeyword[];
}

export default function SpecialityChips({ keywords }: Props) {
  if (keywords.length === 0) return null;
  return (
    <section className="px-4 py-5 border-b border-surface-100">
      <h2 className="typo-h6 text-surface-950 mb-3">Speciality</h2>
      <div className="flex flex-wrap gap-2">
        {keywords.map((k) => (
          <KeywordFilter
            key={k.slug}
            label={k.name}
            activated
            variant="filled"
          />
        ))}
      </div>
    </section>
  );
}
