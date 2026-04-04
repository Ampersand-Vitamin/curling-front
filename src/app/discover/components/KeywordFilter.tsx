// Design Ref: §3.2 — 필터 칩 (activated/default, chevron 유무)
"use client";

interface KeywordFilterProps {
  label: string;
  activated?: boolean;
  showChevron?: boolean;
  onClick?: () => void;
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className}>
      <path d="M3.25 5.25L6.5 8.5L9.75 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function KeywordFilter({
  label,
  activated = false,
  showChevron = false,
  onClick,
}: KeywordFilterProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full py-1 text-[14px] leading-5 tracking-[-0.14px] transition-colors shrink-0 ${
        showChevron ? "pl-2.5 pr-1.5" : "px-2.5"
      } ${
        activated
          ? "bg-primary-50 border border-primary-400 text-primary-700"
          : "bg-surface-200 text-surface-800"
      }`}
    >
      {label}
      {showChevron && <ChevronDown className="size-[13px]" />}
    </button>
  );
}
