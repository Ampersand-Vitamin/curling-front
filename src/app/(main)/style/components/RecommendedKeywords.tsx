"use client";

import type { RecommendedKeyword } from "@/types/style";

interface RecommendedKeywordsProps {
  keywords: RecommendedKeyword[];
  activeSlugs: Set<string>;
  onToggle: (slug: string) => void;
}

function XIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function RecommendedKeywords({
  keywords,
  activeSlugs,
  onToggle,
}: RecommendedKeywordsProps) {
  if (keywords.length === 0) return null;

  return (
    <div className="px-4 w-full">
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {keywords.map((kw) => {
          const active = activeSlugs.has(kw.slug);
          return (
            <button
              key={kw.slug}
              type="button"
              onClick={() => onToggle(kw.slug)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 h-7 rounded-full typo-caption shrink-0 transition-colors ${
                active
                  ? "bg-primary-400 text-white pl-2.5 pr-1.5"
                  : "bg-surface-200 text-surface-800 px-2.5"
              }`}
            >
              <span className="capitalize">{kw.label}</span>
              {active && (
                <span className="flex items-center justify-center size-4 rounded-full bg-primary-300 shrink-0">
                  <XIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
