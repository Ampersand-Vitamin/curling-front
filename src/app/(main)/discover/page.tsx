// Design Ref: §4.3, DS-2 — Server Component wrapper. 서버에서 keyword + salon + designer fetch 후 Client props 전달.
// Plan FR-03, SC-13
import { getFilterKeywords } from "@/lib/keywords";
import { getSalons } from "@/lib/salons";
import { getDesignerMapItems, getBestMatchDesigners } from "@/lib/designers";
import DiscoverClient from "./DiscoverClient";

export default async function DiscoverPage() {
  const [filterSections, salons, designerMapItems, designers] = await Promise.all([
    getFilterKeywords(),
    getSalons(),
    getDesignerMapItems(),
    // 클라이언트에서 활성 필터로 AND 매칭하므로 풀을 크게 가져옴.
    // (작은 limit이면 top N 안에 모든 활성 slug를 보유한 디자이너가 없을 확률이 높음)
    getBestMatchDesigners(200),
  ]);
  return (
    <DiscoverClient
      filterSections={filterSections}
      salons={salons}
      designerMapItems={designerMapItems}
      designers={designers}
    />
  );
}
