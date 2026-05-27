"use client";

import StyleSearchInput from "./StyleSearchInput";
import PhotoSearchChip from "./PhotoSearchChip";

interface StyleSearchTabProps {
  query: string;
  onQueryChange: (next: string) => void;
  onSubmit?: () => void;
  onFilterClick?: () => void;
  onFavoriteClick?: () => void;
  isLoading?: boolean;
  onFileSelect?: (file: File) => void;
  photoMode?: { previewUrl: string; fileName: string } | null;
  onPhotoClear?: () => void;
  /** 활성 필터 수 — 0이면 뱃지 숨김 */
  activeFilterCount?: number;
  /** 검색 input 포커스 시 호출 */
  onSearchFocus?: () => void;
}

export default function StyleSearchTab({
  query,
  onQueryChange,
  onSubmit,
  onFilterClick,
  onFavoriteClick,
  isLoading = false,
  onFileSelect,
  photoMode = null,
  onPhotoClear,
  activeFilterCount = 0,
  onSearchFocus,
}: StyleSearchTabProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-3 w-full">
      {/* 필터 버튼 + 뱃지 */}
      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="Filters"
          onClick={onFilterClick}
          className={`flex items-center justify-center size-12 rounded-full text-surface-900 transition-colors ${
            activeFilterCount > 0 ? "bg-primary-400" : "bg-surface-200"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/filter.svg"
            alt=""
            width={20}
            height={20}
            className={activeFilterCount > 0 ? "[filter:brightness(0)_invert(1)]" : ""}
          />
        </button>
        {activeFilterCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-secondary-400 text-white typo-caption2 px-1 pointer-events-none">
            {activeFilterCount}
          </span>
        )}
      </div>

      {photoMode ? (
        <PhotoSearchChip
          previewUrl={photoMode.previewUrl}
          fileName={photoMode.fileName}
          onRemove={() => onPhotoClear?.()}
        />
      ) : (
        <StyleSearchInput
          value={query}
          onChange={onQueryChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onFileSelect={onFileSelect}
          onFocus={onSearchFocus}
        />
      )}

      <button
        type="button"
        aria-label="Saved"
        onClick={onFavoriteClick}
        className="flex items-center justify-center size-12 rounded-full bg-surface-200 text-surface-900 shrink-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/bookmark.svg" alt="" width={20} height={20} className="opacity-50" />
      </button>
    </div>
  );
}
