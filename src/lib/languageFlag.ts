// language keyword slug → public/flags SVG 매핑
// 매핑 없는 언어(hindi, vietnamese, russian)는 null 반환

const FLAG_BY_SLUG: Record<string, string> = {
  english: "/flags/british-flag.svg",
  korean: "/flags/korean-flag.svg",
  japanese: "/flags/japanese-flag.svg",
  chinese: "/flags/chinese-flag.svg",
  cantonese: "/flags/hong-kong-flag.svg",
  french: "/flags/french-flag.svg",
  spanish: "/flags/spanish-flag.svg",
  arabic: "/flags/saudi-flag.svg",
  thai: "/flags/thai-flag.svg",
  indonesian: "/flags/indonesian-flag.svg",
  german: "/flags/german-flag.svg",
  italian: "/flags/italian-flag.svg",
  turkish: "/flags/turkish-flag.svg",
};

export function getLanguageFlag(slug: string): string | null {
  return FLAG_BY_SLUG[slug] ?? null;
}
