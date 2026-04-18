// Design Ref: §3.4 — 디자이너 카드 (small: 138px, medium: 220px, large: 320px)
import LanguageTag from "./LanguageTag";

export interface DesignerCardProps {
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
  size?: "small" | "medium" | "large";
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const HEIGHT_MAP = {
  small: "h-[138px]",
  medium: "h-[350px]",
  large: "h-[350px]",
} as const;

function DesignerInfo({
  name,
  role,
  languages,
  profileImage,
}: Pick<DesignerCardProps, "name" | "role" | "languages" | "profileImage">) {
  return (
    <>
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
    </>
  );
}

function MessageSection({ message }: { message: string }) {
  return (
    <div className="relative p-2.5 bg-gradient-to-t from-surface-950/50 to-transparent">
      <div className="backdrop-blur-[15px] bg-surface-50/30 rounded-lg px-2.5 py-1.5">
        <p className="typo-caption text-surface-50">
          {message}
        </p>
      </div>
    </div>
  );
}

export default function DesignerCard({
  name,
  role,
  languages,
  profileImage,
  portfolioImage,
  highlightMessage,
  size = "small",
}: DesignerCardProps) {
  const infoProps = { name, role, languages, profileImage };

  return (
    <div className={`relative w-[212px] ${HEIGHT_MAP[size]} rounded-2xl overflow-hidden shrink-0 bg-surface-300`}>
      {/* Portfolio Background */}
      <img
        src={portfolioImage}
        alt={`${name}'s portfolio`}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {size === "small" ? (
        /* Small: single gradient covering full card, justify-between */
        <div className="absolute inset-0 flex flex-col justify-between p-2.5 bg-gradient-to-b from-surface-950 via-surface-950/50 via-50% to-transparent">
          <DesignerInfo {...infoProps} />
        </div>
      ) : (
        /* Medium/Large: separate top + bottom gradient sections */
        <div className="absolute inset-0 flex flex-col justify-between">
          {/* Top gradient */}
          <div className="flex flex-col gap-2 p-2.5 bg-gradient-to-b from-surface-950 to-transparent">
            <DesignerInfo {...infoProps} />
          </div>

          {/* Navigation arrows (large only) */}
          {size === "large" && (
            <div className="flex justify-between px-2.5 text-surface-50">
              <button type="button" className="flex items-center justify-center size-6">
                <ChevronLeft />
              </button>
              <button type="button" className="flex items-center justify-center size-6">
                <ChevronRight />
              </button>
            </div>
          )}

          {/* Bottom message */}
          {highlightMessage && <MessageSection message={highlightMessage} />}
        </div>
      )}
    </div>
  );
}
