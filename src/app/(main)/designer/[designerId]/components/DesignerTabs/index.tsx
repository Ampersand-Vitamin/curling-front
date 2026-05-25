// Design Ref: §4.6, DS-7, FR-15 — designer-detail
//
// Designer/Portfolio 탭바. DetailHeader에서 분리되어 헤더 바로 아래에 위치.

"use client";

import type { DesignerTab } from "../../hooks/useDesignerTabs";

interface Props {
  activeTab: DesignerTab;
  onTabChange: (tab: DesignerTab) => void;
  tabs: { id: DesignerTab; label: string }[];
}

export default function DesignerTabs({ activeTab, onTabChange, tabs }: Props) {
  return (
    <div className="flex h-[44px] bg-surface-white border-b-[0.5px] border-surface-300">
      {tabs.map((t) => {
        const active = t.id === activeTab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={`relative flex-1 flex items-center justify-center transition-colors ${
              active
                ? "typo-h6 text-surface-950"
                : "typo-body1 text-surface-400"
            }`}
          >
            {t.label}
            {active && (
              <span className="absolute bottom-0 h-[3px] w-16 rounded-full bg-primary-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}
