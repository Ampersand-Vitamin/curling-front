export type FavoriteTargetType = "designer" | "portfolio";

export type FavoriteDesigner = {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
  salonName: string | null;
  keywords: { slug: string; name: string; categorySlug: string }[];
  portfolioImages: string[];
};

export type FavoritePortfolio = {
  id: string;
  imagePath: string;
  designerName: string;
  designerProfileImageUrl: string | null;
  salonName: string | null;
};
