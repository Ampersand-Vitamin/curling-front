"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StyleSearchTab from "./components/StyleSearchTab";
import RecommendedKeywords from "./components/RecommendedKeywords";
import PortfolioGrid from "./components/PortfolioGrid";
import { searchStyle } from "@/lib/style/actions";
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

export default function StyleClient({
  initialResult,
  recommended,
}: StyleClientProps) {
  const [query, setQuery] = useState("");
  const [activeSlugs, setActiveSlugs] = useState<Set<string>>(new Set());
  const [cards, setCards] = useState<StylePortfolioCard[]>(initialResult.hits);
  const [cursor, setCursor] = useState<number | null>(initialResult.nextCursor);
  const [isLoading, setIsLoading] = useState(false);

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
        if (requestIdRef.current !== myId) return; // stale
        if (offset === 0) {
          setCards(res.hits);
        } else {
          setCards((prev) => [...prev, ...res.hits]);
        }
        setCursor(res.nextCursor);
      } catch (err) {
        console.warn("[StyleClient] search failed", err);
      } finally {
        if (requestIdRef.current === myId) setIsLoading(false);
      }
    },
    [],
  );

  // query 디바운스 (활성 키워드 변경은 즉시 별도 effect 에서 처리)
  useEffect(() => {
    const handle = setTimeout(() => {
      runSearch(query, Array.from(activeSlugs), 0);
    }, QUERY_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // 의도: query / activeSlugs 동시에 추적. activeSlugs 가 빈번히 바뀌면 같은 디바운스에 묶임.
  }, [query, activeSlugs, runSearch]);

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
    runSearch(query, Array.from(activeSlugs), cursor);
  }, [cursor, isLoading, query, activeSlugs, runSearch]);

  return (
    <div className="flex flex-col h-full bg-surface-50">
      {/* sticky 상단: SearchTab + RecommendedKeywords */}
      <div className="sticky top-0 z-20 flex flex-col items-center bg-surface-50 pt-4 pb-2.5">
        <StyleSearchTab
          query={query}
          onQueryChange={setQuery}
          onSubmit={() => runSearch(query, Array.from(activeSlugs), 0)}
          onFilterClick={() => {
            // 1라운드 — Filter 패널 미구현
          }}
          onFavoriteClick={() => {
            // 1라운드 — Saved 화면 미구현
          }}
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
        hasMore={cursor !== null}
        onLoadMore={onLoadMore}
        emptyMessage={query || activeSlugs.size > 0 ? "No matching styles" : "No designers yet"}
      />
    </div>
  );
}
