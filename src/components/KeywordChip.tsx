type KeywordChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
};

export function KeywordChip({ label, selected, onClick, icon }: KeywordChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl typo-h6 transition-colors ${
        selected ? "bg-primary-400 text-white" : "bg-surface-200 text-surface-950"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
