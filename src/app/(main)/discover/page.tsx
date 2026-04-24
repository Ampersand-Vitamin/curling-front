// Design Ref: §4.3, DS-2 — Server Component wrapper. 서버에서 keyword fetch 후 Client에 props 전달.
// Plan FR-03, SC-13
import { getFilterKeywords } from "@/lib/keywords";
import DiscoverClient from "./DiscoverClient";

export default async function DiscoverPage() {
  const filterSections = await getFilterKeywords();
  return <DiscoverClient filterSections={filterSections} />;
}
