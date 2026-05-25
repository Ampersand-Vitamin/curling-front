import type { StyleTag, StyleImage } from "@/types/styleTab";

export const STYLE_TAGS: StyleTag[] = [
  { id: "all",      label: "전체",      slug: "all" },
  { id: "wave",     label: "웨이브",    slug: "wave" },
  { id: "straight", label: "스트레이트", slug: "straight" },
  { id: "perm",     label: "펌",        slug: "perm" },
  { id: "color",    label: "컬러",      slug: "color" },
  { id: "short",    label: "단발",      slug: "short" },
  { id: "medium",   label: "중발",      slug: "medium" },
  { id: "long",     label: "장발",      slug: "long" },
];

const dummyImages: StyleImage[] = [
  {
    id: "dummy-1",
    imageUrl: "https://picsum.photos/seed/style-a/400/500",
    tags: ["wave", "long"],
    designerName: "김미소",
    salonName: "웨이브헤어",
    profileImageUrl: null,
    designerId: "dummy-designer-1",
  },
  {
    id: "dummy-2",
    imageUrl: "https://picsum.photos/seed/style-b/400/560",
    tags: ["straight", "short"],
    designerName: "이나리",
    salonName: "스트레이트살롱",
    profileImageUrl: null,
    designerId: "dummy-designer-2",
  },
  {
    id: "dummy-3",
    imageUrl: "https://picsum.photos/seed/style-c/400/520",
    tags: ["color", "medium"],
    designerName: "박지수",
    salonName: null,
    profileImageUrl: null,
    designerId: "dummy-designer-3",
  },
];

/**
 * TODO: 데이터 준비 완료 시 실제 API 또는 JSON fetch로 교체할 것.
 * @param tagSlug - 필터링할 태그 slug. undefined 또는 "all"이면 전체 반환.
 */
export async function fetchStyleImages(tagSlug?: string): Promise<StyleImage[]> {
  if (!tagSlug || tagSlug === "all") return dummyImages;
  return dummyImages.filter((img) => img.tags.includes(tagSlug));
}
