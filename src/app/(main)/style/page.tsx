import StyleClient from "./StyleClient";
import { searchStyle } from "@/lib/style/actions";
import { getRecommendedKeywords } from "@/lib/style/recommendedKeywords";

// Style 탭은 매번 fresh — 캐싱하지 않음 (검색은 사용자 query 의존)
export const dynamic = "force-dynamic";

export default async function StylePage() {
  const recommended = getRecommendedKeywords();

  // 초기 그리드: ratingAvg desc 정렬 (search.ts 가 빈 쿼리+빈 필터 케이스 처리)
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

  return <StyleClient initialResult={initialResult} recommended={recommended} />;
}
