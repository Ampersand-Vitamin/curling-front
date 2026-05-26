import StyleClient from "./StyleClient";
import { searchStyle } from "@/lib/style/actions";
import { getRecommendedKeywords } from "@/lib/style/recommendedKeywords";

export const dynamic = "force-dynamic";

export default async function StylePage() {
  const recommended = getRecommendedKeywords();

  let initialResult;
  try {
    initialResult = await searchStyle({ q: "", limit: 30 });
  } catch (err) {
    console.warn("[StylePage] initial search failed — portfolio table / RPC 점검", err);
    initialResult = {
      hits: [],
      totalEstimated: 0,
      nextCursor: null,
      query: "",
      appliedFilters: [],
    };
  }

  return (
    <div className="flex flex-col h-full">
      <StyleClient initialResult={initialResult} recommended={recommended} />
    </div>
  );
}
