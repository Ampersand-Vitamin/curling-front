// Design Ref: §4.18, DS-11 — designer-detail
// Plan FR-13
//
// 임시 Mock. 추후 designer_service 테이블 + 실 데이터 PDCA에서 본 파일 import 경로 1줄 교체.
// designerId 해시로 3가지 변형 분기 → 모든 디자이너 동일 mock 회피 (Plan 리스크 완화).

export type MockServiceTag = "Popular" | "New";

export type MockService = {
  id: string;
  name: string;
  /** 단위: 원 (KRW). UI에서 천단위 콤마 + ₩ 포맷팅 */
  price: number;
  tag?: MockServiceTag;
};

const VARIANTS: MockService[][] = [
  // Variant 0 — Color/Treatment 위주 (K-Pop / 외국인 친화)
  [
    { id: "v0-s1", name: "Balayage & Toning", price: 250000, tag: "Popular" },
    { id: "v0-s2", name: "Customized Magic Straightening", price: 200000 },
    { id: "v0-s3", name: "K-Pop Trend Cut & Styling", price: 90000, tag: "Popular" },
  ],
  // Variant 1 — Curly/Texture 전문
  [
    { id: "v1-s1", name: "Curly Hair Cut & Definition", price: 180000, tag: "Popular" },
    { id: "v1-s2", name: "Protective Style Consultation", price: 150000, tag: "New" },
    { id: "v1-s3", name: "Deep Conditioning Treatment", price: 120000 },
    { id: "v1-s4", name: "Color Refresh", price: 220000 },
  ],
  // Variant 2 — Barber/Cut 위주
  [
    { id: "v2-s1", name: "Skin Fade", price: 80000, tag: "Popular" },
    { id: "v2-s2", name: "Beard Trim & Lineup", price: 50000 },
    { id: "v2-s3", name: "Premium Cut & Hot Towel", price: 130000, tag: "New" },
  ],
];

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function getMockServices(designerId: string): MockService[] {
  const idx = hash(designerId) % VARIANTS.length;
  return VARIANTS[idx];
}
