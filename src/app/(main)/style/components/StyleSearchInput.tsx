"use client";

import { useRef } from "react";

interface StyleSearchInputProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  /** 사진 검색 모드 진입 — 부모가 File 받아서 처리 */
  onFileSelect?: (file: File) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 14L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
    >
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path
        d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="6.25" cy="7" r="1.1" fill="currentColor" />
      <path d="M3 12.5L7 9L11 12L15 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export default function StyleSearchInput({
  value,
  onChange,
  onSubmit,
  onFileSelect,
  placeholder = "Search Salons",
  className = "",
  isLoading = false,
}: StyleSearchInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={`flex items-center justify-between h-12 rounded-full bg-surface-200 pl-4 pr-1 min-w-0 flex-1 ${className}`}
    >
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none typo-body1 text-surface-900 placeholder:text-surface-400 pr-2"
        aria-label="Search styles"
      />
      {/* hidden file picker — photo 아이콘 클릭 시 트리거 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onFileSelect) {
            onFileSelect(file);
            // 같은 파일 다시 선택 가능하게 reset
            e.target.value = "";
          }
        }}
      />
      <div className="flex items-center">
        <button
          type="submit"
          aria-label={isLoading ? "Searching" : "Search"}
          disabled={isLoading}
          className="flex items-center justify-center size-9 rounded-full text-surface-900"
        >
          {isLoading ? <Spinner /> : <SearchIcon />}
        </button>
        <button
          type="button"
          aria-label="Search by photo"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center size-9 rounded-full bg-white border border-surface-200 text-surface-900"
        >
          <PhotoIcon />
        </button>
      </div>
    </form>
  );
}
