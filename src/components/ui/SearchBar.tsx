"use client";

interface SearchBarProps {
  placeholder?: string;
  onClick?: () => void;
  className?: string;
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 14L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function SearchBar({
  placeholder = "Search salons",
  onClick,
  className = "",
}: SearchBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between h-[50px] rounded-full bg-white pl-4 pr-2 min-w-0 flex-1 ${className}`}
    >
      <span className="typo-body1 text-surface-400 truncate">{placeholder}</span>
      <span className="flex items-center justify-center size-8 text-surface-900">
        <SearchIcon />
      </span>
    </button>
  );
}
