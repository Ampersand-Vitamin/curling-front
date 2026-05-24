import type { DesignerListItem } from "./types";

export function selectDesignerPortfolioImage(
  designer: DesignerListItem,
  keywordSlugs: string[] = [],
) {
  const selected = new Set(keywordSlugs);
  const matched =
    selected.size > 0
      ? designer.portfolioPreviews.find((portfolio) =>
          portfolio.keywordSlugs.some((slug) => selected.has(slug)),
        )
      : null;

  return matched?.imagePath ?? designer.portfolioImages[0] ?? "";
}
