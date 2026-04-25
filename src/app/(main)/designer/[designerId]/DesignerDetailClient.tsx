// Design Ref: §4.5, §5.2, FR-04, FR-15 — designer-detail
//
// Client orchestrator — 탭/북마크 hook 호출 + 섹션 렌더만 담당.
// 데이터는 page.tsx (Server) 에서 props 로 주입.

"use client";

import type { DesignerDetail } from "@/lib/designers";
import { useDesignerTabs } from "./hooks/useDesignerTabs";
import { useFavoriteToggle } from "./hooks/useFavoriteToggle";
import DetailHeader from "./components/DetailHeader";
import PortfolioHero from "./components/PortfolioHero";
import DesignerInfoSection from "./components/DesignerInfoSection";
import HighlightBubble from "./components/HighlightBubble";
import ReservationSection from "./components/ReservationSection";
import SpecialityChips from "./components/SpecialityChips";
import LanguageSection from "./components/LanguageSection";
import PortfolioGrid from "./components/PortfolioGrid";
import ServicesList from "./components/ServicesList";
import ReviewSection from "./components/ReviewSection";

interface Props {
  designer: DesignerDetail;
}

export default function DesignerDetailClient({ designer }: Props) {
  const { activeTab, setActiveTab, tabs } = useDesignerTabs();
  const { isFavorite, toggle } = useFavoriteToggle(designer.id);

  // Plan FR-10 / Design §4.13: Speciality 는 treatment 카테고리만
  const specialityKeywords = designer.keywords.filter(
    (k) => k.categorySlug === "treatment",
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-[76px] bg-surface-white">
      <DetailHeader
        name={designer.displayName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      />

      {activeTab === "designer" && (
        <>
          <PortfolioHero
            images={designer.portfolioImages}
            isFavorite={isFavorite}
            onToggleFavorite={toggle}
            designerName={designer.displayName}
          />
          <DesignerInfoSection designer={designer} />
          <HighlightBubble
            message={designer.highlightMessage}
            designerName={designer.displayName}
          />
          <ReservationSection links={designer.otherLinks} />
          <SpecialityChips keywords={specialityKeywords} />
          <LanguageSection languages={designer.languages} />
          <PortfolioGrid
            images={designer.portfolioImages}
            limit={4}
            columns={2}
            onViewMore={() => setActiveTab("portfolio")}
          />
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
