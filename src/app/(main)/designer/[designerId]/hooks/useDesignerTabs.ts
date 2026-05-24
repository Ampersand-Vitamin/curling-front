// Design Ref: §4.6, DS-7 — designer-detail
// Plan FR-15
//
// 탭 상태 hook. 현재는 클라 useState 기반.
// 추후 URL 동기화(useSearchParams + router.replace)로 본문만 교체. 시그니처 동일.

"use client";

import { useState } from "react";

export type DesignerTab = "designer" | "portfolio";

type TabDef = { id: DesignerTab; label: string };

const TABS: TabDef[] = [
  { id: "designer", label: "Designer" },
  { id: "portfolio", label: "Portfolio" },
];

export function useDesignerTabs(initial: DesignerTab = "designer") {
  const [activeTab, setActiveTab] = useState<DesignerTab>(initial);

  return {
    activeTab,
    setActiveTab,
    tabs: TABS,
  };
}
