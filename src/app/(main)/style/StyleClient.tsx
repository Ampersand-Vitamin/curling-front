"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StyleSearchTab from "./components/StyleSearchTab";
import RecommendedKeywords from "./components/RecommendedKeywords";
import PortfolioGrid from "./components/PortfolioGrid";
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
  // Design Ref: §6.2 — photo 검색 모드. null 이면 text 모드.
  const [photoSearch, setPhotoSearch] = useState<PhotoSearchState | null>(null);

  // 동시성 가드: 이전 요청이 늦게 도착해도 최신만 반영
  const requestIdRef = useRef(0);

  const runSearch = useCallback(
    async (q: string, slugs: string[], offset = 0) => {
      const myId = ++requestIdRef.current;
      setIsLoading(true);
      try {
        const res = await searchStyle({
          q,
          keywordSlugs: slugs,
          cursor: offset,
        });
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

  // 텍스트 검색은 디바운스. 단, photo 모드에서는 텍스트 검색 비활성.
  useEffect(() => {
    if (photoSearch) return;
    const handle = setTimeout(() => {
      runSearch(query, Array.from(activeSlugs), 0);
    }, QUERY_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, activeSlugs, runSearch, photoSearch]);

  // 사진 또는 키워드 칩 변경 시 photo 모드면 재검색
  useEffect(() => {
    if (!photoSearch) return;
    runPhotoSearch(photoSearch.file, Array.from(activeSlugs));
  }, [photoSearch, activeSlugs, runPhotoSearch]);

  // preview URL cleanup
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

  const onLoadMore = useCallback(() => {
    if (cursor === null || isLoading) return;
    // photo 모드는 페이지네이션 미지원 (RPC 가 cursor 안 받음) — text 모드만
    if (photoSearch) return;
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

  return (
    <div className="flex flex-col h-full bg-surface-50">
      <div className="sticky top-0 z-20 flex flex-col items-center bg-surface-50 pt-4 pb-2.5">
        <StyleSearchTab
          query={query}
          onQueryChange={setQuery}
          onSubmit={() => runSearch(query, Array.from(activeSlugs), 0)}
          isLoading={isLoading}
          onFilterClick={() => {}}
          onFavoriteClick={() => {}}
          onFileSelect={onFileSelect}
          photoMode={
            photoSearch
              ? { previewUrl: photoSearch.previewUrl, fileName: photoSearch.file.name }
              : null
          }
          onPhotoClear={onPhotoClear}
        />
        <RecommendedKeywords
          keywords={recommended}
          activeSlugs={activeSlugs}
          onToggle={onToggleKeyword}
        />
      </div>

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
    </div>
  );
}
