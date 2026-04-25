// Design Ref: §4.8, §6.1, FR-05, FR-20 — designer-detail
//
// sticky 상단 헤더: ← (router.back) + 디자이너 이름 + Designer/Portfolio 탭

"use client";

import { useRouter } from "next/navigation";
import type { DesignerTab } from "../../hooks/useDesignerTabs";

function ChevronLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

interface Props {
  name: string;
  activeTab: DesignerTab;
  onTabChange: (tab: DesignerTab) => void;
  tabs: { id: DesignerTab; label: string }[];
}

export default function DetailHeader({ name, activeTab, onTabChange, tabs }: Props) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-30 bg-surface-white border-b border-surface-100">
      {/* Top row */}
      <div className="flex items-center h-14 px-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="size-10 flex items-center justify-center rounded-full text-surface-950 active:bg-surface-100"
        >
          <ChevronLeft />
        </button>
        <div className="flex-1 text-center typo-h6 text-surface-950">{name}</div>
        <button
          type="button"
          aria-label="더보기"
          className="size-10 flex items-center justify-center rounded-full text-surface-950 active:bg-surface-100"
        >
          <MoreIcon />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex">
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
    </div>
  );
}
