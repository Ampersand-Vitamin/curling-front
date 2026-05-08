// Design Ref: §3.4 — 디자이너 카드 (고정 212x225)
// Plan FR-17 — id prop + <Link> 래핑으로 /designer/[id] 이동
import Link from "next/link";
import LanguageTag from "./LanguageTag";

export interface DesignerCardProps {
  id: string;
  name: string;
  role: string;
  languages: string[];
  profileImage: string;
  portfolioImage: string;
  highlightMessage?: string;
  isVerified?: boolean;
  ratingAvg?: number;
  reviewCount?: number;
  yearsOfExp?: number;
}

export default function DesignerCard({
  id,
  name,
  role,
  languages,
  profileImage,
  portfolioImage,
}: DesignerCardProps) {
  return (
    <Link
      href={`/designer/${id}`}
      prefetch={false}
      className="relative block w-[212px] h-[225px] rounded-2xl overflow-hidden shrink-0 bg-surface-300"
    >
      {/* Portfolio Background */}
      <img
        src={portfolioImage}
        alt={`${name}'s portfolio`}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay + DesignerInfo */}
      <div className="absolute inset-0 flex flex-col justify-between p-2.5 bg-gradient-to-b from-surface-950 via-surface-950/50 via-50% to-transparent">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-end gap-1 min-w-0">
            <span className="typo-h3 text-surface-50 whitespace-nowrap">
              {name}
            </span>
            <span className="typo-caption text-surface-200 pb-0.5">
              {role}
            </span>
          </div>
          <div className="size-[30px] rounded-full overflow-hidden shrink-0 bg-surface-400">
            <img src={profileImage} alt={name} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex gap-1">
          {languages.map((lang) => (
            <LanguageTag key={lang} language={lang} />
          ))}
        </div>
      </div>
    </Link>
  );
}
