import MapView from "./components/MapView";
import ViewToggle from "./components/ViewToggle";
import PullBar from "./components/PullBar";

export default function DiscoverPage() {
  return (
    <div className="relative h-screen flex flex-col">
      {/* 뷰 전환 토글 */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10">
        <ViewToggle />
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
