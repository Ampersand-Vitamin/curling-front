// Design Ref: §4.14, §6.6, FR-11 — designer-detail
//
// 디자이너 구사 언어 칩. 라이트 배경용 (LanguageTag는 dark 전용이라 별도 칩으로 렌더).

import KeywordFilter from "@/app/(main)/discover/components/KeywordFilter";
import { getLanguageFlag } from "@/lib/languageFlag";

function FlagIcon({ src }: { src: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      className="size-5 rounded-full shrink-0"
    />
  );
}

interface Props {
  languages: string[];
}

export default function LanguageSection({ languages }: Props) {
  if (languages.length === 0) return null;
  return (
    <section>
      <h2 className="typo-h4 text-surface-950 mb-3">Languages</h2>
      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => {
          const flag = getLanguageFlag(lang);
          return (
            <KeywordFilter
              key={lang}
              label={lang}
              variant="outlined"
              leadingIcon={flag ? <FlagIcon src={flag} /> : undefined}
            />
          );
        })}
      </div>
    </section>
  );
}
