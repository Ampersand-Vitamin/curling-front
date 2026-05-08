// Design Ref: §4.7, DS-8 — designer-detail
// Plan D-7
//
// 즐겨찾기 토글 hook. 이번 PDCA는 UI-only (영속화 X).
// 시그니처 { isFavorite, toggle, isLoading } 는 추후 favorite 테이블 + Auth 도입 시
// useMutation/useQuery 패턴으로 본문만 교체. 호출 컴포넌트(PortfolioHero) 변경 X.

"use client";

import { useState } from "react";

export function useFavoriteToggle(_designerId: string) {
  const [isFavorite, setIsFavorite] = useState(false);

  return {
    isFavorite,
    toggle: () => setIsFavorite((v) => !v),
    isLoading: false,
  };
}
