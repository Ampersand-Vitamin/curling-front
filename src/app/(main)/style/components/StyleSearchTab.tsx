"use client";

import StyleSearchInput from "./StyleSearchInput";

interface StyleSearchTabProps {
  query: string;
  onQueryChange: (next: string) => void;
  onSubmit?: () => void;
  onFilterClick?: () => void;
  onFavoriteClick?: () => void;
}

function FilterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5h14M5 10h10M7 15h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 3.5h10v13l-5-3-5 3v-13z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StyleSearchTab({
  query,
  onQueryChange,
  onSubmit,
  onFilterClick,
  onFavoriteClick,
}: StyleSearchTabProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-3 w-full">
      <button
        type="button"
        aria-label="Filters"
        onClick={onFilterClick}
        className="flex items-center justify-center size-12 rounded-full bg-surface-200 text-surface-900 shrink-0"
      >
        <FilterIcon />
      </button>

      <StyleSearchInput
        value={query}
        onChange={onQueryChange}
        onSubmit={onSubmit}
      />

      <button
        type="button"
        aria-label="Saved"
        onClick={onFavoriteClick}
        className="flex items-center justify-center size-12 rounded-full bg-surface-200 text-surface-900 shrink-0"
      >
        <BookmarkIcon />
      </button>
    </div>
  );
}
