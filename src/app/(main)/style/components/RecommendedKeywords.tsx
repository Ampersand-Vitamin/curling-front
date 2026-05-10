"use client";

import type { RecommendedKeyword } from "@/types/style";

interface RecommendedKeywordsProps {
  keywords: RecommendedKeyword[];
  activeSlugs: Set<string>;
  onToggle: (slug: string) => void;
}

export default function RecommendedKeywords({
  keywords,
  activeSlugs,
  onToggle,
}: RecommendedKeywordsProps) {
  if (keywords.length === 0) return null;

  return (
    <div className="px-4 w-full">
      <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {keywords.map((kw) => {
          const active = activeSlugs.has(kw.slug);
          return (
            <button
              key={kw.slug}
              type="button"
              onClick={() => onToggle(kw.slug)}
              aria-pressed={active}
              className={`flex items-center gap-1 h-7 px-2 rounded-full typo-caption shrink-0 transition-colors ${
                active
                  ? "bg-secondary-400 text-white"
                  : "bg-surface-200 text-surface-800"
              }`}
            >
              <span className="capitalize">{kw.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
