// Design Ref: §3.5 — 섹션 타이틀 + 카드 수평 스크롤 리스트
import DesignerCard from "./DesignerCard";

const MOCK_DESIGNERS = [
  {
    id: "1",
    name: "Sejin",
    role: "Designer" as const,
    languages: ["english", "korean"],
    profileImage: "/mock/profile-sejin.jpg",
    portfolioImage: "/mock/portfolio-sejin.jpg",
    highlightMessage: "98% of Curly hair women were satisfied with Sejin.",
    bio: "Curly hair specialist with passion for natural textures.",
    yearsOfExp: 8,
    ratingAvg: 4.9,
    reviewCount: 127,
    isVerified: true,
    hairTypeExperience: ["Wavy Hair (2a-2c)", "Curly Hair (3a-3c)"],
  },
  {
    id: "2",
    name: "Jay",
    role: "Designer" as const,
    languages: ["english", "korean"],
    profileImage: "/mock/profile-jay.jpg",
    portfolioImage: "/mock/portfolio-jay.jpg",
    highlightMessage: "Jay has multiple experience with Curly hair.",
    bio: "Expert in protective styles and loc maintenance.",
    yearsOfExp: 5,
    ratingAvg: 4.7,
    reviewCount: 83,
    isVerified: true,
    hairTypeExperience: ["Curly Hair (3a-3c)", "Coily Hair (4a-4c)"],
  },
  {
    id: "3",
    name: "Yuna",
    role: "Designer" as const,
    languages: ["english", "korean"],
    profileImage: "/mock/profile-yuna.jpg",
    portfolioImage: "/mock/portfolio-yuna.jpg",
    highlightMessage: "Yuna has multiple experience with Curly hair.",
    bio: "Color specialist for curly and wavy hair types.",
    yearsOfExp: 6,
    ratingAvg: 4.8,
    reviewCount: 95,
    isVerified: false,
    hairTypeExperience: ["Wavy Hair (2a-2c)"],
  },
];

export default function DesignerCarousel() {
  return (
    <div className="flex flex-col gap-4 pb-20">
      <p className="typo-h5 text-surface-950">
        Best Match for you
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
            highlightMessage={designer.highlightMessage}
          />
        ))}
      </div>
    </div>
  );
}
