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
    <div className="flex bg-surface-white border-b border-surface-100">
      {tabs.map((t) => {
        const active = t.id === activeTab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={`flex-1 py-3 text-center transition-colors ${
              active
                ? "typo-button text-surface-950 border-b-2 border-primary-600"
                : "typo-body2 text-surface-500 border-b-2 border-transparent"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
