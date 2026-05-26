export type HairProfileKeyword = { label: string; flag?: string };

export type HairProfileData = {
  type: "hair-profile";
  name: string;
  bio?: string;
  avatarUrl?: string | null;
  keywords: HairProfileKeyword[];
};

export function HairProfileCard({ name, avatarUrl, keywords }: Omit<HairProfileData, "type">) {
  return (
    <div
      className="bg-white flex flex-col gap-4 px-4 py-3"
      style={{ width: 240, borderRadius: 16 }}
    >
      {/* Avatar + name */}
      <div className="flex gap-3 items-center">
        <div className="size-10 rounded-full overflow-hidden shrink-0 bg-surface-200 flex items-center justify-center border border-surface-300">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-surface-400">
              <circle cx="12" cy="9" r="4" />
              <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
            </svg>
          )}
        </div>
        <p className="typo-h5 text-surface-950 flex-1 min-w-0">{name}</p>
      </div>

      {/* Keyword chips */}
      <div className="flex flex-wrap gap-1">
        {keywords.map((kw, i) => (
          <div
            key={i}
            className={`flex items-center gap-1 h-7 rounded-full bg-white border border-surface-300 ${kw.flag ? "pl-1 pr-2.5" : "px-2"}`}
          >
            {kw.flag && (
              <img src={kw.flag} alt="" className="size-5 rounded-full object-cover shrink-0" />
            )}
            <p className="typo-caption text-surface-700 whitespace-nowrap capitalize">{kw.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function parseHairProfile(content: string): HairProfileData | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.type === "hair-profile" && parsed.name !== undefined) {
      return parsed as HairProfileData;
    }
  } catch {
    // not JSON
  }
  return null;
}
