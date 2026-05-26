"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StyleSearchTab from "./components/StyleSearchTab";
import StyleFilterPopup, { STYLE_SLUG_MAP } from "./components/StyleFilterPopup";
import RecommendedKeywords from "./components/RecommendedKeywords";
import PortfolioGrid from "./components/PortfolioGrid";
import StyleSearchSuggestions from "./components/StyleSearchSuggestions";
import { searchStyle, searchStyleByImage } from "@/lib/style/actions";
import type {
  RecommendedKeyword,
  StylePortfolioCard,
  StyleSearchResult,
} from "@/types/style";

interface StyleClientProps {
  initialResult: StyleSearchResult;
  recommended: RecommendedKeyword[];
}

const QUERY_DEBOUNCE_MS = 300;

type PhotoSearchState = {
  file: File;
  previewUrl: string;
};

export default function StyleClient({
  initialResult,
  recommended,
}: StyleClientProps) {
  const [query, setQuery] = useState("");
  const [activeSlugs, setActiveSlugs] = useState<Set<string>>(new Set());
  const [cards, setCards] = useState<StylePortfolioCard[]>(initialResult.hits);
  const [cursor, setCursor] = useState<number | null>(initialResult.nextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [photoSearch, setPhotoSearch] = useState<PhotoSearchState | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const requestIdRef = useRef(0);

  const runSearch = useCallback(
    async (q: string, slugs: string[], offset = 0) => {
      const myId = ++requestIdRef.current;
      setIsLoading(true);
      try {
        const res = await searchStyle({ q, keywordSlugs: slugs, cursor: offset });
        if (requestIdRef.current !== myId) return;
        if (offset === 0) setCards(res.hits);
        else setCards((prev) => [...prev, ...res.hits]);
        setCursor(res.nextCursor);
      } catch (err) {
        console.warn("[StyleClient] search failed", err);
      } finally {
        if (requestIdRef.current === myId) setIsLoading(false);
      }
    },
    [],
  );

  const runPhotoSearch = useCallback(async (file: File, slugs: string[]) => {
    const myId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set("image", file);
      if (slugs.length > 0) formData.set("keywordSlugs", slugs.join(","));
      const res = await searchStyleByImage(formData);
      if (requestIdRef.current !== myId) return;
      setCards(res.hits);
      setCursor(res.nextCursor);
    } catch (err) {
      console.warn("[StyleClient] photo search failed", err);
    } finally {
      if (requestIdRef.current === myId) setIsLoading(false);
    }
  }, []);

  const filterQuery = useMemo(() => {
    if (activeSlugs.size === 0) return "";
    return Array.from(activeSlugs)
      .map((slug) => STYLE_SLUG_MAP.get(slug) ?? slug.replace(/_/g, " "))
      .join(" ");
  }, [activeSlugs]);

  const combinedQuery = useMemo(
    () => [query, filterQuery].filter(Boolean).join(" "),
    [query, filterQuery],
  );

  useEffect(() => {
    if (photoSearch) return;
    const handle = setTimeout(() => {
      runSearch(combinedQuery, [], 0);
    }, QUERY_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [combinedQuery, runSearch, photoSearch]);

  useEffect(() => {
    if (!photoSearch) return;
    runPhotoSearch(photoSearch.file, []);
  }, [photoSearch, activeSlugs, runPhotoSearch]);

  useEffect(() => {
    return () => {
      if (photoSearch) URL.revokeObjectURL(photoSearch.previewUrl);
    };
  }, [photoSearch]);

  const onToggleKeyword = useCallback((slug: string) => {
    setActiveSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const onRemoveKeyword = useCallback((slug: string) => {
    setActiveSlugs((prev) => {
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  }, []);

  const onLoadMore = useCallback(() => {
    if (cursor === null || isLoading || photoSearch) return;
    runSearch(query, Array.from(activeSlugs), cursor);
  }, [cursor, isLoading, query, activeSlugs, runSearch, photoSearch]);

  const onFileSelect = useCallback((file: File) => {
    setPhotoSearch((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  }, []);

  const onPhotoClear = useCallback(() => {
    setPhotoSearch((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setShowSuggestions(false);
    runSearch(query, Array.from(activeSlugs), 0);
  }, [query, activeSlugs, runSearch]);

  return (
    <div className="relative flex flex-col h-full bg-surface-50">
      {/* 상단 고정 영역 */}
      <div className="sticky top-0 z-20 flex flex-col items-center bg-surface-50 pt-4 pb-2.5">
        <StyleSearchTab
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSearchSubmit}
          isLoading={isLoading}
          onFilterClick={() => {
            setShowSuggestions(false);
            setShowFilter(true);
          }}
          onFavoriteClick={() => {}}
          onFileSelect={onFileSelect}
          photoMode={
            photoSearch
              ? { previewUrl: photoSearch.previewUrl, fileName: photoSearch.file.name }
              : null
          }
          onPhotoClear={onPhotoClear}
          activeFilterCount={activeSlugs.size}
          onSearchFocus={() => setShowSuggestions(true)}
        />
        <RecommendedKeywords
          keywords={recommended}
          activeSlugs={activeSlugs}
          onToggle={onToggleKeyword}
        />
      </div>

      {/* 포트폴리오 그리드 */}
      <PortfolioGrid
        cards={cards}
        isLoading={isLoading}
        hasMore={!photoSearch && cursor !== null}
        onLoadMore={onLoadMore}
        emptyMessage={
          photoSearch
            ? "No visually similar portfolios"
            : query || activeSlugs.size > 0
              ? "No matching styles"
              : "No designers yet"
        }
      />

      {/* 검색 제안 패널 (Screen 4) */}
      {showSuggestions && !showFilter && (
        <StyleSearchSuggestions
          keywords={recommended}
          activeSlugs={activeSlugs}
          onToggleKeyword={onToggleKeyword}
          onClose={() => setShowSuggestions(false)}
        />
      )}

      {/* 필터 팝업 오버레이 */}
      {showFilter && (
        <>
          <div className="absolute inset-0 backdrop-blur-sm z-30" />
          <div className="absolute inset-0 z-30 bg-gradient-to-b from-surface-950/30 via-surface-950/70 to-surface-950/80" />
          <div className="absolute inset-x-3 top-3 bottom-3 z-40">
            <StyleFilterPopup
              activeKeywords={activeSlugs}
              onToggle={onToggleKeyword}
              onRemove={onRemoveKeyword}
              onClose={() => setShowFilter(false)}
              onApply={() => setShowFilter(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
