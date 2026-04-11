/**
 * 헤어 태그 택소노미 (분류 체계)
 *
 * K-Hairstyle 데이터셋(KAIST, 50만 장)의 분류 체계를 그대로 반영.
 * 참고: https://psh01087.github.io/K-Hairstyle/
 *
 * - 모든 태깅은 이 목록 안에서만 이루어짐
 * - Vision AI 프롬프트에 이 목록을 전달하여 일관성 유지
 * - weight: 매칭 시 카테고리별 가중치 (높을수록 중요)
 * - mustMatch: true면 불일치 시 매칭 후보에서 제외
 */

export interface TagCategory {
  key: string;
  label: string;
  weight: number;
  mustMatch: boolean;
  multiple: boolean;
  tags: string[];
}

export const TAXONOMY: TagCategory[] = [
  // ── basestyle (K-Hairstyle: 31 types) ─────────────────────
  {
    key: "basestyle",
    label: "베이스 스타일",
    weight: 3,
    mustMatch: false,
    multiple: true,
    tags: [
      "Hershey",
      "Dandy",
      "Build",
      "Parted",
      "Short male",
      "Tassel",
      "Other female",
      "Comma",
      "Short female",
      "Pomade",
      "Bob",
      "Hippi",
      "Misty",
      "Pleats",
      "As",
      "See-through dandy",
      "Leaf",
      "Air",
      "Body",
      "Spin swallow",
      "Soft two-block dandy",
      "One-block dandy",
      "One length",
      "Other layered",
      "Loop",
      "Other male",
      "Baby",
      "Regent",
      "Bonnie",
      "Shadow",
      "Short bob",
    ],
  },

  // ── basestyle_type (K-Hairstyle) ──────────────────────────
  {
    key: "basestyle_type",
    label: "스타일 길이 타입",
    weight: 1,
    mustMatch: false,
    multiple: false,
    tags: ["short", "long"],
  },

  // ── length (K-Hairstyle) ──────────────────────────────────
  {
    key: "length",
    label: "길이",
    weight: 2,
    mustMatch: false,
    multiple: false,
    tags: ["female short", "male", "short", "long", "medium"],
  },

  // ── curl (K-Hairstyle) ────────────────────────────────────
  {
    key: "curl",
    label: "컬",
    weight: 2,
    mustMatch: false,
    multiple: false,
    tags: ["S", "C", "J", "SC", "CS", "CC", "X", "S3", "SS"],
  },

  // ── bang (K-Hairstyle) ────────────────────────────────────
  {
    key: "bang",
    label: "앞머리",
    weight: 2,
    mustMatch: false,
    multiple: false,
    tags: [
      "along faceline",
      "others",
      "slightly swept",
      "None",
      "full bang",
      "see-through",
      "choppy bang",
    ],
  },

  // ── loss (K-Hairstyle) ────────────────────────────────────
  {
    key: "loss",
    label: "탈모",
    weight: 1,
    mustMatch: false,
    multiple: false,
    tags: ["None", "partial", "early stage", "hair loss"],
  },

  // ── side (K-Hairstyle) ────────────────────────────────────
  {
    key: "side",
    label: "사이드",
    weight: 1,
    mustMatch: false,
    multiple: false,
    tags: ["one-block", "None", "two-block"],
  },

  // ── color (K-Hairstyle) ───────────────────────────────────
  {
    key: "color",
    label: "색상",
    weight: 3,
    mustMatch: true,
    multiple: true,
    tags: [
      "reddish brown",
      "yellowish brown",
      "natural brown",
      "Ombre",
      "ash brown",
      "others",
      "black",
      "two-tone",
      "pink-brown",
    ],
  },

  // ── partition (K-Hairstyle) ───────────────────────────────
  {
    key: "partition",
    label: "가르마",
    weight: 1,
    mustMatch: false,
    multiple: false,
    tags: ["9:1", "None", "7:3", "8:2", "2:8", "1:9", "6:4", "3:7", "4:6", "5:5"],
  },

  // ── exceptional (K-Hairstyle) ─────────────────────────────
  {
    key: "exceptional",
    label: "특수 스타일링",
    weight: 1,
    mustMatch: false,
    multiple: true,
    tags: [
      "swept hair",
      "ponytail",
      "braided",
      "Buzz cut",
      "accessories",
      "curly hair",
      "others",
      "None",
    ],
  },

  // ── gender (K-Hairstyle) ──────────────────────────────────
  {
    key: "gender",
    label: "성별",
    weight: 2,
    mustMatch: false,
    multiple: false,
    tags: ["female", "male"],
  },
];

/** 전체 태그 수 */
export const TOTAL_TAG_COUNT = TAXONOMY.reduce(
  (sum, cat) => sum + cat.tags.length,
  0
);

/** 카테고리 key로 빠르게 조회 */
export const TAXONOMY_MAP = Object.fromEntries(
  TAXONOMY.map((cat) => [cat.key, cat])
);

/** Vision AI 프롬프트에 넣을 태그 목록 문자열 생성 */
export function buildTagPromptSection(): string {
  return TAXONOMY.map(
    (cat) =>
      `- ${cat.label} (${cat.key})${cat.multiple ? " [복수 선택 가능]" : ""}: [${cat.tags.join(", ")}]`
  ).join("\n");
}
