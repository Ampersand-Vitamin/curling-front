import MapView from "./components/MapView";
import ViewToggle from "./components/ViewToggle";
import DesignerCarousel from "./components/DesignerCarousel";

export default function DiscoverPage() {
  return (
    <div className="relative h-screen flex flex-col">
      {/* 뷰 전환 토글 */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10">
        <ViewToggle />
      </div>

      {/* 지도 영역 */}
      <div className="flex-1">
        <MapView />
      </div>

      {/* 하단 디자이너 캐러셀 */}
      <div className="px-4 py-4">
        <DesignerCarousel />
      </div>
    </div>
  );
}
