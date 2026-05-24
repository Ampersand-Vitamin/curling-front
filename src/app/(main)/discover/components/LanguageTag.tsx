// Design Ref: §3.3 — 국기 SVG + 언어 텍스트 태그
interface LanguageTagProps {
  language: string;
}

const FLAG_MAP: Record<string, { flag: string; label: string }> = {
  korean: { flag: "/flags/korean-flag.svg", label: "Korean" },
  english: { flag: "/flags/british-flag.svg", label: "English" },
  japanese: { flag: "/flags/japanese-flag.svg", label: "Japanese" },
  chinese: { flag: "/flags/chinese-flag.svg", label: "Chinese" },
};

export default function LanguageTag({ language }: LanguageTagProps) {
  const entry = FLAG_MAP[language];
  const flag = entry?.flag;
  const label = entry?.label ?? language;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-50/30 pl-0.5 pr-1 py-0.5">
      {flag && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={flag}
          alt=""
          width={14}
          height={14}
          className="rounded-full"
        />
      )}
      <span className="typo-caption2 text-surface-50 whitespace-nowrap">
        {label}
      </span>
    </span>
  );
}
