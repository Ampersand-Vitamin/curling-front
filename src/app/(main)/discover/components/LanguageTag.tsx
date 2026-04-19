// Design Ref: §3.3 — 국기 emoji + 언어 텍스트 태그
interface LanguageTagProps {
  language: "korean" | "english";
}

const FLAG_MAP = {
  korean: { flag: "\uD83C\uDDF0\uD83C\uDDF7", label: "Korean" },
  english: { flag: "\uD83C\uDDEC\uD83C\uDDE7", label: "English" },
} as const;

export default function LanguageTag({ language }: LanguageTagProps) {
  const { flag, label } = FLAG_MAP[language];

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-50/30 pl-0.5 pr-1 py-0.5">
      <span className="text-[10px] leading-none">{flag}</span>
      <span className="text-[11px] leading-[13px] tracking-[-0.5px] text-surface-50 whitespace-nowrap">
        {label}
      </span>
    </span>
  );
}
