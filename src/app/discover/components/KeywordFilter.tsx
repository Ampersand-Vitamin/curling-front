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
      className={`flex items-center justify-center rounded-full px-[10px] py-[6px] text-[12px] leading-[16px] tracking-[-0.5px] capitalize transition-colors shrink-0 ${
        activated
          ? "bg-secondary-400 text-white"
          : "bg-white border-[0.5px] border-surface-400 text-surface-800"
      }`}
    >
      {label}
      {showChevron && <ChevronDown className="size-[13px]" />}
    </button>
  );
}
