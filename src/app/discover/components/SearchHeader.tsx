"use client";

import IconButton from "@/components/ui/IconButton";
import SearchBar from "@/components/ui/SearchBar";
import KeywordFilter from "./KeywordFilter";
import { storageUrl } from "@/lib/storage";
import { useState } from "react";

const KEYWORDS = [
  { label: "English Speaker" },
  { label: "Curly Hair Expert" },
  { label: "Foreigner Friendly" },
];

export default function SearchHeader() {
  const [activeKeywords, setActiveKeywords] = useState<Set<string>>(new Set());
  const filterCount = activeKeywords.size;

  const toggleKeyword = (label: string) => {
    setActiveKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <div className="flex flex-col w-full">
      {/* Search Row */}
      <div className="flex items-center gap-1 px-3 py-3">
        <IconButton variant="dark" badge={filterCount > 0 ? filterCount : undefined}>
          <img src={storageUrl("asset/discover/filter_v2.svg")} alt="filter" width={20} height={20} />
        </IconButton>
        <SearchBar />
        <IconButton variant="light">
          <img src={storageUrl("asset/discover/salon.svg")} alt="salon" width={20} height={20} />
        </IconButton>
      </div>

      {/* Keyword Chips */}
      <div className="flex gap-2 px-3 overflow-x-auto scrollbar-hide">
        {KEYWORDS.map((kw) => (
          <KeywordFilter
            key={kw.label}
            label={kw.label}
            activated={activeKeywords.has(kw.label)}
            onClick={() => toggleKeyword(kw.label)}
          />
        ))}
      </div>
    </div>
  );
}
