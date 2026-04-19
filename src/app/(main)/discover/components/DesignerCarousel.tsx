// Design Ref: §3.5 — 섹션 타이틀 + 카드 수평 스크롤 리스트
import DesignerCard from "./DesignerCard";

const MOCK_DESIGNERS = [
  {
    id: "1",
    name: "Sejin",
    role: "Designer",
    languages: ["english", "korean"] as const,
    profileImage: "/mock/profile-sejin.jpg",
    portfolioImage: "/mock/portfolio-sejin.jpg",
    message: "98% of Curly hair women were satisfied with Sejin.",
  },
  {
    id: "2",
    name: "Jay",
    role: "Designer",
    languages: ["english", "korean"] as const,
    profileImage: "/mock/profile-jay.jpg",
    portfolioImage: "/mock/portfolio-jay.jpg",
    message: "Jay has multiple experience with Curly hair.",
  },
  {
    id: "3",
    name: "Yuna",
    role: "Designer",
    languages: ["english", "korean"] as const,
    profileImage: "/mock/profile-yuna.jpg",
    portfolioImage: "/mock/portfolio-yuna.jpg",
    message: "Yuna has multiple experience with Curly hair.",
  },
];

interface DesignerCarouselProps {
  cardSize?: "small" | "medium" | "large";
}

export default function DesignerCarousel({
  cardSize = "small",
}: DesignerCarouselProps) {
  return (
    <div className="flex flex-col gap-4 pb-20">
      <p className="text-[18px] font-medium leading-[26px] tracking-[-0.18px] text-surface-950">
        Popular Designer with Curly hair
      </p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {MOCK_DESIGNERS.map((designer) => (
          <DesignerCard
            key={designer.id}
            name={designer.name}
            role={designer.role}
            languages={[...designer.languages]}
            profileImage={designer.profileImage}
            portfolioImage={designer.portfolioImage}
            message={designer.message}
            size={cardSize}
          />
        ))}
      </div>
    </div>
  );
}
