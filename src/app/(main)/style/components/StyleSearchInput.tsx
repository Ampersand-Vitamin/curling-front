"use client";

interface StyleSearchInputProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  onPhotoClick?: () => void;
  placeholder?: string;
  className?: string;
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 14L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
  onPhotoClick,
  placeholder = "Search Salons",
  className = "",
}: StyleSearchInputProps) {
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
      <div className="flex items-center">
        <button
          type="submit"
          aria-label="Search"
          className="flex items-center justify-center size-9 rounded-full text-surface-900"
        >
          <SearchIcon />
        </button>
        <button
          type="button"
          aria-label="Search by photo"
          onClick={onPhotoClick}
          className="flex items-center justify-center size-9 rounded-full bg-white border border-surface-200 text-surface-900"
        >
          <PhotoIcon />
        </button>
      </div>
    </form>
  );
}
