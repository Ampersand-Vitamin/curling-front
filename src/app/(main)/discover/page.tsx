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
    getBestMatchDesigners(10),
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
