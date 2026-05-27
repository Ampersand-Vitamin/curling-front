"use client";

import IconButton from "@/components/ui/IconButton";
import SearchBar from "@/components/ui/SearchBar";
import KeywordFilter from "./KeywordFilter";
import type { DiscoverMode } from "@/types/discover";

const KEYWORDS = [
  { slug: "english", label: "English Speaker" },
  { slug: "curly_hair_expert", label: "Curly Hair Expert" },
  { slug: "foreigner_friendly", label: "Foreigner Friendly" },
];

function CloseIcon() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/icons/cancel.svg"
      alt=""
      width={16}
      height={16}
      className="[filter:brightness(0)_invert(1)]"
    />
  );
}

interface SearchHeaderProps {
  activeKeywords: Set<string>;
  showFilter: boolean;
  mode: DiscoverMode;
  onToggleKeyword: (keyword: string) => void;
  onFilterPress: () => void;
  onFilterClose: () => void;
  onToggleMode: () => void;
}

export default function SearchHeader({
  activeKeywords,
  showFilter,
  mode,
  onToggleKeyword,
  onFilterPress,
  onFilterClose,
  onToggleMode,
}: SearchHeaderProps) {
  const filterCount = activeKeywords.size;

  return (
    <div className="flex flex-col w-full">
      {/* Search Row */}
      <div className="flex items-center gap-1 px-3 py-3">
        <IconButton badge={filterCount > 0 ? filterCount : undefined} onClick={onFilterPress} variant={filterCount > 0 ? "dark" : "light"}>
          <img src="/icons/filter.svg" alt="filter" width={20} height={20} className={filterCount > 0 ? "[filter:brightness(0)_invert(1)]" : ""} />
        </IconButton>
        <SearchBar
          placeholder={showFilter ? "Search Keywords" : "Search salons"}
          onClick={showFilter ? undefined : onFilterPress}
        />
        {showFilter ? (
          <button
            type="button"
            onClick={onFilterClose}
            className="flex items-center justify-center size-[46px] rounded-full shrink-0 bg-surface-100/30"
          >
            <CloseIcon />
          </button>
        ) : (
          <IconButton variant="light" onClick={onToggleMode}>
            <img
              src={mode === "salon" ? "/icons/salon.svg" : "/icons/designer.svg"}
              alt={mode === "salon" ? "salon" : "designer"}
              width={20}
              height={20}
            />
          </IconButton>
        )}
      </div>

      {/* Keyword Chips — 필터 닫혀있을 때만 */}
      {!showFilter && (
        <div className="flex gap-2 px-3 overflow-x-auto scrollbar-hide">
          {KEYWORDS.map((kw) => (
            <KeywordFilter
              key={kw.slug}
              label={kw.label}
              activated={activeKeywords.has(kw.slug)}
              onClick={() => onToggleKeyword(kw.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
