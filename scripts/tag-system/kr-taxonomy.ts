/**
 * 헤어 태그 택소노미 (분류 체계)
 *
 * K-Hairstyle 데이터셋(KAIST, 50만 장, 31타입 + 63속성)의
 * 분류 체계를 참고하여 서비스에 맞게 재구성.
 *
 * - 모든 태깅은 이 목록 안에서만 이루어짐
 * - Vision AI 프롬프트에 이 목록을 전달하여 일관성 유지
 * - weight: 매칭 시 카테고리별 가중치 (높을수록 중요)
 * - mustMatch: true면 불일치 시 매칭 후보에서 제외
 *
 * 참고: https://psh01087.github.io/K-Hairstyle/
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
  // ── 기본 스타일 (K-Hairstyle: 31 basestyle 참고) ──────────
  {
    key: "basestyle",
    label: "베이스 스타일",
    weight: 3,
    mustMatch: false,
    multiple: true,
    tags: [
      // 여성 숏
      "보브",
      "숏보브",
      "픽시",
      // 여성 미디엄~롱
      "레이어드",
      "원랭스",
      "히피펌",
      "바디펌",
      "허쉬컷",
      "쉐기",
      "울프",
      "태슬컷",
      "빌드펌",
      // 남성
      "투블럭",
      "댄디컷",
      "포마드",
      "리젠트",
      "콤마펌",
      "가일컷",
      "쉐도우펌",
      // 공용
      "에어펌",
      "리프컷",
      "루프펌",
      "미스티펌",
    ],
  },

  // ── 길이 (K-Hairstyle: length) ────────────────────────────
  {
    key: "length",
    label: "길이",
    weight: 2,
    mustMatch: false,
    multiple: false,
    tags: ["크롭", "숏", "미디엄", "롱"],
  },

  // ── 컬/텍스처 (K-Hairstyle: curl — S, C, J, SC 등) ────────
  {
    key: "curl",
    label: "컬/웨이브",
    weight: 2,
    mustMatch: false,
    multiple: false,
    tags: [
      "스트레이트",
      "C컬",        // 자연스러운 안쪽 말림
      "S컬",        // S자 웨이브
      "J컬",        // 끝만 살짝 말림
      "볼륨웨이브",  // 큰 웨이브
      "스크런치컬",  // 강한 컬
      "내추럴",      // 자연 그대로
    ],
  },

  // ── 앞머리 (K-Hairstyle: bang) ────────────────────────────
  {
    key: "bang",
    label: "앞머리",
    weight: 2,
    mustMatch: false,
    multiple: false,
    tags: [
      "풀뱅",         // 이마를 덮는 일자 앞머리
      "시스루뱅",      // 얇게 비치는 앞머리
      "사이드뱅",      // 옆으로 넘긴 앞머리
      "커튼뱅",        // 양쪽으로 갈라진 앞머리
      "쵸피뱅",        // 불규칙하게 자른 앞머리
      "앞머리없음",    // 이마 노출
    ],
  },

  // ── 가르마 (K-Hairstyle: partition — 9:1, 7:3 등) ─────────
  {
    key: "part",
    label: "가르마",
    weight: 1,
    mustMatch: false,
    multiple: false,
    tags: [
      "센터가르마",    // 5:5
      "6:4가르마",
      "7:3가르마",
      "8:2가르마",
      "9:1가르마",
      "가르마없음",
    ],
  },

  // ── 사이드 (K-Hairstyle: side) ────────────────────────────
  {
    key: "side",
    label: "사이드",
    weight: 1,
    mustMatch: false,
    multiple: false,
    tags: [
      "투블럭사이드",   // 옆 짧게 밀기
      "원블럭사이드",   // 옆 한 덩어리
      "내추럴사이드",   // 자연스러운 옆머리
    ],
  },

  // ── 색상 (K-Hairstyle: color — 9개 + 확장) ────────────────
  {
    key: "color",
    label: "색상",
    weight: 3,
    mustMatch: true,
    multiple: true,
    tags: [
      // K-Hairstyle 기본
      "블랙",
      "내추럴브라운",   // 자연 갈색
      "레디시브라운",   // 붉은 갈색
      "옐로이시브라운", // 노란 갈색
      "애쉬브라운",     // 잿빛 갈색
      "핑크브라운",     // 분홍 갈색
      // 추가 색상
      "블론드",
      "애쉬",
      "실버",
      "레드",
      "핑크",
      "블루",
      // 염색 기법
      "옴브레",         // 위아래 색상 그라데이션
      "발레아쥬",       // 자연스러운 하이라이트
      "투톤",           // 두 가지 색상
      "하이라이트",
    ],
  },

  // ── 톤 ────────────────────────────────────────────────────
  {
    key: "tone",
    label: "톤",
    weight: 3,
    mustMatch: true,
    multiple: false,
    tags: ["웜톤", "쿨톤", "뉴트럴"],
  },

  // ── 특수 스타일링 (K-Hairstyle: exceptional) ──────────────
  {
    key: "styling",
    label: "스타일링",
    weight: 1,
    mustMatch: false,
    multiple: true,
    tags: [
      "업스타일",      // 올린 머리
      "포니테일",
      "브레이드",      // 땋은 머리
      "반묶음",
      "악세서리",
      "없음",
    ],
  },

  // ── 무드 ──────────────────────────────────────────────────
  {
    key: "mood",
    label: "무드",
    weight: 1,
    mustMatch: false,
    multiple: true,
    tags: ["클래식", "캐주얼", "모던", "빈티지", "시크", "청순", "힙", "엘레강스"],
  },

  // ── 성별 (K-Hairstyle: gender) ────────────────────────────
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
