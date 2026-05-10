// Meilisearch `designers` 인덱스 settings 의 SSOT.
//
// ⚠️ 변경 시 영향:
//   - searchableAttributes/filterableAttributes/sortableAttributes 변경 → updateSettings 재실행
//   - embedders.documentTemplate / dimensions 변경 → 전체 재임베딩 (= 비용 발생)
//
// 변경 PR 은 별도 의사결정 후 진행. 임의 추가 금지.

import { EMBEDDER_NAME } from "./types";

/** 배포 환경에선 OPENAI_API_KEY 가 server runtime 에서만 참조됨. */
function readOpenAiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "[meili/schema] OPENAI_API_KEY not set. embedders 등록에 필요합니다.",
    );
  }
  return key;
}

/** Meilisearch 1.20+ — Liquid 템플릿. 한국어 bio 통과. */
const DESIGNER_DOCUMENT_TEMPLATE = `\
A salon designer named {{ doc.displayName }} ({{ doc.role }}).
{% if doc.keywordNames %}Specialties: {{ doc.keywordNames | join: ", " }}.{% endif %}
{% if doc.languages %}Languages: {{ doc.languages | join: ", " }}.{% endif %}
{% if doc.salonName %}Works at {{ doc.salonName }}{% if doc.salonNeighborhood %} in {{ doc.salonNeighborhood }}{% endif %}.{% endif %}
{% if doc.highlightMessage %}Highlight: {{ doc.highlightMessage }}.{% endif %}
{% if doc.bio %}Bio: {{ doc.bio }}{% endif %}\
`;

/**
 * `client.index('designers').updateSettings(designersSettings())` 한 번에 적용.
 * 함수형으로 둔 이유: OPENAI_API_KEY 가 import 시점이 아니라 호출 시점에 검증되도록.
 */
export function designersSettings() {
  return {
    searchableAttributes: [
      "displayName",
      "highlightMessage",
      "keywordNames",
      "bio",
      "salonName",
      "role",
      "salonNeighborhood",
    ],
    filterableAttributes: [
      "salonId",
      "salonType",
      "salonNeighborhood",
      "keywordSlugs",
      "specialtySlugs",
      "experienceSlugs",
      "hairTypeSlugs",
      "treatmentSlugs",
      "amenitySlugs",
      "inclusivitySlugs",
      "languages",
      "isVerified",
      "yearsOfExp",
      "ratingAvg",
    ],
    sortableAttributes: [
      "ratingAvg",
      "reviewCount",
      "yearsOfExp",
      "createdAtTs",
    ],
    displayedAttributes: [
      "id",
      "displayName",
      "role",
      "highlightMessage",
      "profileImageUrl",
      "coverImageUrl",
      "salonId",
      "salonName",
      "keywordNames",
      "languages",
    ],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
      // slug 류는 정확매칭 — typo 끄기
      disableOnAttributes: [
        "keywordSlugs",
        "specialtySlugs",
        "experienceSlugs",
        "hairTypeSlugs",
        "treatmentSlugs",
        "amenitySlugs",
        "inclusivitySlugs",
        "salonId",
      ],
    },
    embedders: {
      [EMBEDDER_NAME]: {
        source: "openAi" as const,
        apiKey: readOpenAiKey(),
        model: "text-embedding-3-large",
        dimensions: 1536,
        documentTemplate: DESIGNER_DOCUMENT_TEMPLATE,
        documentTemplateMaxBytes: 1200,
      },
    },
  };
}
