"use client";

import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import FavoriteButton from "@/components/ui/FavoriteButton";
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

function PortfolioTabCard({ src, index, portfolioId }: { src: string; index: number; portfolioId: string }) {
  return (
    <Link href={`/portfolio/${portfolioId}`} className="flex flex-col gap-2.5">
      <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
        <SafeImage
          src={src}
          alt={`Portfolio ${index + 1}`}
          fallback="portfolio"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <FavoriteButton virant={32} status="Default" />
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-[59px]"
          style={{ background: "linear-gradient(to bottom, rgba(23,23,23,0), rgba(23,23,23,0.5))" }}
        />
      </div>
    </Link>
  );
}

export default function DesignerDetailClient({ designer }: Props) {
  const { activeTab, setActiveTab, tabs } = useDesignerTabs();
  const { isFavorite, toggle } = useFavoriteToggle(designer.id);

  const salonLabel = designer.salon
    ? designer.salon.address
      ? `${designer.salon.name}, ${designer.salon.address}`
      : designer.salon.name
    : null;

  const messageHref = designer.otherLinks?.message ?? `/chat/new?designerId=${designer.id}`;

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-[76px] bg-white">
      <div className="sticky top-0 z-30">
        <DetailHeader
          name={designer.displayName}
          profileImageUrl={designer.profileImageUrl}
          salonLabel={salonLabel}
          messageHref={messageHref}
        />
        <DesignerTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
      </div>

      {activeTab === "designer" && (
        <>
          <PortfolioHero
            images={designer.portfolioImages}
            designerName={designer.displayName}
          />
          <div className="px-4 py-6 flex flex-col gap-10">
            <DesignerInfoSection
              designer={designer}
              isFavorite={isFavorite}
              onToggleFavorite={toggle}
            />
            <SpecialityChips keywords={designer.keywords} />
            <ReservationSection links={designer.otherLinks} />
            <LanguageSection languages={designer.languages} />
            <PortfolioGrid
              items={designer.portfolioItems}
              limit={4}
              columns={2}
              onViewMore={() => setActiveTab("portfolio")}
            />
            {designer.salon && <SalonSection salon={designer.salon} />}
            <ServicesList designerId={designer.id} />
            <ReviewSection designerId={designer.id} />
            <Link
              href={messageHref}
              className="flex items-center justify-center w-full py-4 bg-primary-400 rounded-lg typo-h6 text-white active:opacity-90"
            >
              Start Conversation with {designer.displayName}
            </Link>
          </div>
        </>
      )}

      {activeTab === "portfolio" && (
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 gap-2">
            {designer.portfolioItems.map((item, i) => (
              <PortfolioTabCard key={item.id} src={item.imageUrl} index={i} portfolioId={item.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
