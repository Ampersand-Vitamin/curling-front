// Design Ref: §4.1 — designer-detail (Public surface)
//
// 외부에서는 이 파일만 import: `from "@/lib/designers"`.
// Node module resolution: "designers" → "designers/index.ts" 자동 해석되므로
// 기존 `src/lib/designers.ts` 삭제 후에도 import 경로 변경 불필요.
//   - MapView (designer 마커): getDesignerMapItems
//   - DiscoverClient/Carousel: getBestMatchDesigners
//   - designer/[designerId]/page.tsx: getDesignerById

export type {
  DesignerDetail,
  DesignerKeyword,
  DesignerListItem,
  DesignerLinks,
  DesignerMapItem,
} from "./types";

export { getDesignerById } from "./queries";
export { getBestMatchDesigners, getDesignerMapItems } from "./list";
