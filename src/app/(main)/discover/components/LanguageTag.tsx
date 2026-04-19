// Design Ref: §3.3 — 국기 emoji + 언어 텍스트 태그
interface LanguageTagProps {
  language: string;
}

const FLAG_MAP: Record<string, { flag: string; label: string }> = {
  korean: { flag: "\uD83C\uDDF0\uD83C\uDDF7", label: "Korean" },
  english: { flag: "\uD83C\uDDEC\uD83C\uDDE7", label: "English" },
  japanese: { flag: "\uD83C\uDDEF\uD83C\uDDF5", label: "Japanese" },
  chinese: { flag: "\uD83C\uDDE8\uD83C\uDDF3", label: "Chinese" },
};

export default function LanguageTag({ language }: LanguageTagProps) {
  const { flag, label } = FLAG_MAP[language] ?? { flag: "🌐", label: language };

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-50/30 pl-0.5 pr-1 py-0.5">
      <span className="text-[10px] leading-none">{flag}</span>
      <span className="typo-caption2 text-surface-50 whitespace-nowrap">
        {label}
      </span>
    </span>
  );
}
