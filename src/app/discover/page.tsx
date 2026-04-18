import MapView from "./components/MapView";
import SearchHeader from "./components/SearchHeader";
import PullBar from "./components/PullBar";

export default function DiscoverPage() {
  return (
    <div className="relative h-screen flex flex-col">
      {/* 검색 헤더 — 지도 위 상단 고정 */}
      <div className="absolute top-10 left-0 right-0 z-10">
        <SearchHeader />
      </div>

      {/* 지도 영역 — 전체 화면 */}
      <div className="absolute inset-0">
        <MapView />
      </div>

      {/* 하단 Pull Bar — 지도 위에 겹침 */}
      <div className="mt-auto relative z-10">
        <PullBar />
      </div>
    </div>
  );
}
