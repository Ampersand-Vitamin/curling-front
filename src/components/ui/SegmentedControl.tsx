"use client";

type Tab = {
  key: string;
  label: string;
};

type SegmentedControlProps = {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
};

export default function SegmentedControl({
  tabs,
  activeKey,
  onChange,
  className,
}: SegmentedControlProps) {
  return (
    <div
      className={`flex h-11 bg-white border-b-[0.5px] border-surface-200 ${className ?? ""}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex-1 flex flex-col items-center justify-end gap-2 pb-px relative"
          >
            <span
              className={
                isActive
                  ? "typo-h6 text-surface-950"
                  : "typo-body1 text-surface-400"
              }
            >
              {tab.label}
            </span>
            {/* 3px indicator at bottom */}
            <div className="h-0 relative w-16 shrink-0">
              <div
                className={`absolute rounded-full bg-secondary-400 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`}
                style={{ inset: "-3px 0 0 0" }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
