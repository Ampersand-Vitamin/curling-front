// 추천 키워드 — 1라운드 하드코딩.
// 추후 DB 인기 키워드 또는 사용자 프로필 기반 동적 추천으로 교체.

import type { RecommendedKeyword } from "@/types/style";

/**
 * Figma `547:13544` 의 칩 라벨을 keyword.slug 와 매칭.
 * slug 는 supabase/seed/30_keywords.sql, 31_keywords_v2.sql 기준.
 * (slug 미존재 키워드도 포함될 수 있음 — 인덱싱 결과에 따라 0건일 수 있고 그것도 OK)
 */
const STATIC_RECOMMENDED: RecommendedKeyword[] = [
  { slug: "korean_perm", label: "Korean Perm" },
  { slug: "balayage", label: "Balayage" },
  { slug: "highlights", label: "Highlight" },
  { slug: "brown_hair", label: "Brown Hair" },
  { slug: "curly_cut", label: "Curly Cut" },
];

export function getRecommendedKeywords(): RecommendedKeyword[] {
  return STATIC_RECOMMENDED;
}
