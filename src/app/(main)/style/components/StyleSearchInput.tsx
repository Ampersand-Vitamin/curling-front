"use client";

interface StyleSearchInputProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  onFocus?: () => void;
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


export default function StyleSearchInput({
  value,
  onChange,
  onSubmit,
  onFocus,
  placeholder = "Search Salons",
  className = "",
  isLoading = false,
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
        onFocus={onFocus}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none typo-body1 text-surface-900 placeholder:text-surface-400 pr-2"
        aria-label="Search styles"
      />
      <button
        type="submit"
        aria-label={isLoading ? "Searching" : "Search"}
        disabled={isLoading}
        className="flex items-center justify-center size-9 rounded-full text-surface-900 shrink-0"
      >
        {isLoading ? <Spinner /> : <SearchIcon />}
      </button>
    </form>
  );
}
