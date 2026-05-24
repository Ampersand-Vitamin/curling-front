// Design Ref: §4.5, §5.2, FR-04, FR-15 — designer-detail
//
// Client orchestrator — 탭/북마크 hook 호출 + 섹션 렌더만 담당.
// 데이터는 page.tsx (Server) 에서 props 로 주입.

"use client";

import type { DesignerDetail } from "@/lib/designers";
import { useDesignerTabs } from "./hooks/useDesignerTabs";
import { useFavoriteToggle } from "./hooks/useFavoriteToggle";
import DetailHeader from "./components/DetailHeader";
import DesignerTabs from "./components/DesignerTabs";
import PortfolioHero from "./components/PortfolioHero";
import DesignerInfoSection from "./components/DesignerInfoSection";
import ReservationSection from "./components/ReservationSection";
import SpecialityChips from "./components/SpecialityChips";
import LanguageSection from "./components/LanguageSection";
import PortfolioGrid from "./components/PortfolioGrid";
import SalonSection from "./components/SalonSection";
import ServicesList from "./components/ServicesList";
import ReviewSection from "./components/ReviewSection";

interface Props {
  designer: DesignerDetail;
}

export default function DesignerDetailClient({ designer }: Props) {
  const { activeTab, setActiveTab, tabs } = useDesignerTabs();
  const { isFavorite, toggle } = useFavoriteToggle(designer.id);

  const salonLabel = designer.salon
    ? designer.salon.address
      ? `${designer.salon.name}, ${designer.salon.address}`
      : designer.salon.name
    : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-[76px] bg-surface-white">
      <div className="sticky top-0 z-30">
        <DetailHeader
          name={designer.displayName}
          profileImageUrl={designer.profileImageUrl}
          salonLabel={salonLabel}
          messageHref={`/messages/${designer.id}`}
        />
        <DesignerTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
      </div>

      {activeTab === "designer" && (
        <>
          <PortfolioHero
            images={designer.portfolioImages}
            isFavorite={isFavorite}
            onToggleFavorite={toggle}
            designerName={designer.displayName}
          />
          <DesignerInfoSection designer={designer} />
          <SpecialityChips keywords={designer.keywords} />
          <ReservationSection links={designer.otherLinks} />
          <LanguageSection languages={designer.languages} />
          <PortfolioGrid
            images={designer.portfolioImages}
            limit={4}
            columns={2}
            onViewMore={() => setActiveTab("portfolio")}
          />
          {designer.salon && <SalonSection salon={designer.salon} />}
          <ServicesList designerId={designer.id} />
          <ReviewSection designerId={designer.id} />
        </>
      )}

      {activeTab === "portfolio" && (
        <PortfolioGrid
          images={designer.portfolioImages}
          columns={3}
          showHeader={false}
        />
      )}
    </div>
  );
}
