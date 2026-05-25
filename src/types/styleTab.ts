export type StyleTag = {
  id: string;
  label: string;
  slug: string;
};

export type StyleImage = {
  id: string;
  imageUrl: string;
  /** client-side 필터링에 사용되는 tag slug 배열 */
  tags: string[];
  designerName: string;
  salonName?: string | null;
  profileImageUrl?: string | null;
  designerId: string;
};
