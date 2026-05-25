"use client";

import type { StyleTag } from "@/types/styleTab";

interface StyleTagFilterBarProps {
  tags: StyleTag[];
  activeSlug: string;
  onChange: (slug: string) => void;
}

export default function StyleTagFilterBar({
  tags,
  activeSlug,
  onChange,
}: StyleTagFilterBarProps) {
  return (
    <div className="px-4 w-full">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {tags.map((tag) => {
          const isActive = tag.slug === activeSlug;
          return (
            <button
              key={tag.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(tag.slug)}
              className={`flex items-center justify-center px-4 h-8 rounded-full shrink-0 typo-button transition-colors ${
                isActive
                  ? "bg-primary-700 text-white"
                  : "bg-surface-200 text-surface-600"
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
