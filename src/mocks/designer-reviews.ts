// Design Ref: §4.19, DS-11 — designer-detail
// Plan FR-14
//
// 임시 Mock. 추후 review 테이블 + Auth + 작성 플로우 PDCA에서 교체.
// designerId 해시로 3가지 변형 분기 (Mock 다양성 확보).

export type MockReview = {
  id: string;
  rating: number; // 1-5
  body: string;
  authorName: string;
  /** ISO date — UI에서 상대 시간 표시 가능 */
  createdAt: string;
};

const VARIANTS: MockReview[][] = [
  // Variant 0
  [
    {
      id: "v0-r1",
      rating: 5,
      body: "Finally found someone who knows curly hair in Korea! Very patient with English communication.",
      authorName: "Sarah M.",
      createdAt: "2026-03-12",
    },
    {
      id: "v0-r2",
      rating: 5,
      body: "Best balayage I've had in Seoul. Lived-in color exactly as I wanted.",
      authorName: "Emma L.",
      createdAt: "2026-02-28",
    },
    {
      id: "v0-r3",
      rating: 4,
      body: "Great cut and styling. The salon was a bit crowded but the work was worth it.",
      authorName: "Yuki T.",
      createdAt: "2026-02-10",
    },
  ],
  // Variant 1
  [
    {
      id: "v1-r1",
      rating: 5,
      body: "Amazing experience! Truly understands textured hair. Will be back.",
      authorName: "Maya R.",
      createdAt: "2026-03-20",
    },
    {
      id: "v1-r2",
      rating: 4,
      body: "Solid cut and color. Good consultation beforehand.",
      authorName: "Chloe K.",
      createdAt: "2026-03-01",
    },
  ],
  // Variant 2
  [
    {
      id: "v2-r1",
      rating: 5,
      body: "Cleanest fade I've gotten in Seoul. Knows exactly what works for foreign hair.",
      authorName: "James O.",
      createdAt: "2026-04-05",
    },
    {
      id: "v2-r2",
      rating: 5,
      body: "Quick, precise, and friendly. English no problem at all.",
      authorName: "Daniel P.",
      createdAt: "2026-03-22",
    },
    {
      id: "v2-r3",
      rating: 4,
      body: "Good cut, prices fair. Recommend booking ahead — usually busy.",
      authorName: "Marcus T.",
      createdAt: "2026-03-15",
    },
  ],
];

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function getMockReviews(designerId: string): MockReview[] {
  const idx = hash(designerId) % VARIANTS.length;
  return VARIANTS[idx];
}
