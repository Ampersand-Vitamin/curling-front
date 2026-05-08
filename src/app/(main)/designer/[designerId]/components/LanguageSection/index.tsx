// Design Ref: §4.14, §6.6, FR-11 — designer-detail
//
// 디자이너 구사 언어 칩. 라이트 배경용 (LanguageTag는 dark 전용이라 별도 칩으로 렌더).

const FLAG_MAP: Record<string, { flag: string; label: string }> = {
  korean:   { flag: "🇰🇷", label: "Korean" },
  english:  { flag: "🇬🇧", label: "English" },
  japanese: { flag: "🇯🇵", label: "Japanese" },
  chinese:  { flag: "🇨🇳", label: "Chinese" },
  spanish:  { flag: "🇪🇸", label: "Spanish" },
  french:   { flag: "🇫🇷", label: "French" },
};

function LangChip({ language }: { language: string }) {
  const { flag, label } = FLAG_MAP[language] ?? { flag: "🌐", label: language };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 px-2.5 py-1 bg-surface-white">
      <span className="text-[14px] leading-none">{flag}</span>
      <span className="typo-caption text-surface-800 capitalize">{label}</span>
    </span>
  );
}

interface Props {
  languages: string[];
}

export default function LanguageSection({ languages }: Props) {
  if (languages.length === 0) return null;
  return (
    <section className="px-4 py-5 border-b border-surface-100">
      <h2 className="typo-h6 text-surface-950 mb-3">Language</h2>
      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => (
          <LangChip key={lang} language={lang} />
        ))}
      </div>
    </section>
  );
}
