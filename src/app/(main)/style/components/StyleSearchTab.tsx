"use client";

import { useRef } from "react";
import StyleSearchInput from "./StyleSearchInput";
import PhotoSearchChip from "./PhotoSearchChip";

function PhotoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="6.25" cy="7" r="1.1" fill="currentColor" />
      <path d="M3 12.5L7 9L11 12L15 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex items-center gap-2 px-3 py-3 w-full">
      {/* 필터 버튼 + 뱃지 */}
      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="Filters"
          onClick={onFilterClick}
          className={`flex items-center justify-center size-11 rounded-full text-surface-900 transition-colors ${
            activeFilterCount > 0 ? "bg-surface-900" : "bg-surface-200"
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
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary-400 text-white typo-caption2 px-1 pointer-events-none">
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
          onFocus={onSearchFocus}
        />
      )}

      {/* 숨겨진 파일 인풋 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onFileSelect) {
            onFileSelect(file);
            e.target.value = "";
          }
        }}
      />

      {/* 사진 검색 버튼 — photo 모드일 때 숨김 */}
      {!photoMode && (
        <button
          type="button"
          aria-label="Search by photo"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center size-11 rounded-2xl bg-secondary-400 text-white shrink-0"
        >
          <PhotoIcon />
        </button>
      )}

      {/* 북마크 버튼 */}
      <button
        type="button"
        aria-label="Saved"
        onClick={onFavoriteClick}
        className="flex items-center justify-center size-11 rounded-full bg-surface-200 text-surface-900 shrink-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/bookmark.svg" alt="" width={20} height={20} className="opacity-50" />
      </button>
    </div>
  );
}
