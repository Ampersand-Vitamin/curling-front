/**
 * 헤어 태그 택소노미 (분류 체계)
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
  multiple: boolean; // 복수 선택 가능 여부
  tags: string[];
}

export const TAXONOMY: TagCategory[] = [
  {
    key: "length",
    label: "길이",
    weight: 2,
    mustMatch: false,
    multiple: false,
    tags: ["크롭", "숏", "미디엄", "롱"],
  },
  {
    key: "cut",
    label: "컷 스타일",
    weight: 2,
    mustMatch: false,
    multiple: true,
    tags: [
      "레이어드",
      "보브",
      "쉐기",
      "울프",
      "투블럭",
      "허쉬",
      "테이퍼",
      "원랭스",
      "픽시",
      "가일컷",
    ],
  },
  {
    key: "texture",
    label: "텍스처",
    weight: 1,
    mustMatch: false,
    multiple: false,
    tags: ["스트레이트", "웨이브", "컬", "내추럴"],
  },
  {
    key: "color",
    label: "색상",
    weight: 3,
    mustMatch: true,
    multiple: true,
    tags: [
      "블랙",
      "다크브라운",
      "브라운",
      "라이트브라운",
      "블론드",
      "애쉬",
      "실버",
      "레드",
      "핑크",
      "블루",
      "하이라이트",
      "발레아쥬",
      "옴브레",
    ],
  },
  {
    key: "tone",
    label: "톤",
    weight: 3,
    mustMatch: true,
    multiple: false,
    tags: ["웜톤", "쿨톤", "뉴트럴"],
  },
  {
    key: "mood",
    label: "무드",
    weight: 1,
    mustMatch: false,
    multiple: true,
    tags: ["클래식", "캐주얼", "모던", "빈티지", "시크", "청순", "힙"],
  },
  {
    key: "gender",
    label: "성별",
    weight: 2,
    mustMatch: false,
    multiple: false,
    tags: ["남성", "여성", "유니섹스"],
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
