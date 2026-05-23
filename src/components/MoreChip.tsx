type MoreChipProps = {
  onClick: () => void;
};

export function MoreChip({ onClick }: MoreChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-surface-400 typo-h6 text-surface-950"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 3.333v9.334M3.333 8h9.334" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      More
    </button>
  );
}
