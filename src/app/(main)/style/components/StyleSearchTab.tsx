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
  /** photo 검색 모드 — File 선택됨 */
  onFileSelect?: (file: File) => void;
  /** photo 검색 모드 활성 — input 자리에 chip 표시 */
  photoMode?: { previewUrl: string; fileName: string } | null;
  /** chip 의 X 클릭 — text 모드 복귀 */
  onPhotoClear?: () => void;
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
}: StyleSearchTabProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-3 w-full">
      <button
        type="button"
        aria-label="Filters"
        onClick={onFilterClick}
        className="flex items-center justify-center size-12 rounded-full bg-surface-200 text-surface-900 shrink-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/filter.svg" alt="" width={20} height={20} />
      </button>

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
