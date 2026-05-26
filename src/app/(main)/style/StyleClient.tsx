"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StyleSearchTab from "./components/StyleSearchTab";
import StyleFilterPopup, { STYLE_SLUG_MAP } from "./components/StyleFilterPopup";
import RecommendedKeywords from "./components/RecommendedKeywords";
import PortfolioGrid from "./components/PortfolioGrid";
import StyleSearchSuggestions from "./components/StyleSearchSuggestions";
import ImageKeywordsPopup from "./components/ImageKeywordsPopup";
import { searchStyle, searchStyleByImage, extractImageKeywords, toggleFavoritePortfolio } from "@/lib/style/actions";
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

type ImagePopupState = {
  file: File;
  previewUrl: string;
  stage: "initial" | "keywords";
  keywords: RecommendedKeyword[];
  selectedSlugs: Set<string>;
  isExtracting: boolean;
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
  const router = useRouter();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [imagePopup, setImagePopup] = useState<ImagePopupState | null>(null);

  const requestIdRef = useRef(0);
  const reselectInputRef = useRef<HTMLInputElement | null>(null);

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

  // 사진 검색: photoSearch 또는 activeSlugs 변경 시 재실행
  useEffect(() => {
    if (!photoSearch) return;
    runPhotoSearch(photoSearch.file, Array.from(activeSlugs));
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

  const onFavoriteClick = useCallback(async (portfolioId: string) => {
    // 낙관적 업데이트
    setCards((prev) =>
      prev.map((c) => c.id === portfolioId ? { ...c, isFavorited: !c.isFavorited } : c)
    );
    try {
      await toggleFavoritePortfolio(portfolioId);
    } catch {
      // 실패 시 롤백
      setCards((prev) =>
        prev.map((c) => c.id === portfolioId ? { ...c, isFavorited: !c.isFavorited } : c)
      );
    }
  }, []);

  const onLoadMore = useCallback(() => {
    if (cursor === null || isLoading || photoSearch) return;
    runSearch(query, Array.from(activeSlugs), cursor);
  }, [cursor, isLoading, query, activeSlugs, runSearch, photoSearch]);

  // 파일 선택 → 팝업 열기 (즉시 검색 X)
  const onFileSelect = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setImagePopup({
      file,
      previewUrl,
      stage: "initial",
      keywords: [],
      selectedSlugs: new Set(),
      isExtracting: false,
    });
  }, []);

  // 팝업 내 Reselect → 파일 선택기 재오픈
  const onReselect = useCallback(() => {
    reselectInputRef.current?.click();
  }, []);

  // Reselect 파일 선택 시 팝업 이미지 교체
  const onReselectFile = useCallback((file: File) => {
    setImagePopup((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        stage: "initial",
        keywords: [],
        selectedSlugs: new Set(),
        isExtracting: false,
      };
    });
  }, []);

  // Extract Keywords 클릭 → CLIP 키워드 스코어링
  const onExtractKeywords = useCallback(async () => {
    if (!imagePopup) return;
    setImagePopup((prev) => prev ? { ...prev, isExtracting: true } : prev);
    try {
      const formData = new FormData();
      formData.set("image", imagePopup.file);
      const keywords = await extractImageKeywords(formData);
      setImagePopup((prev) =>
        prev
          ? {
              ...prev,
              stage: "keywords",
              keywords,
              selectedSlugs: new Set(keywords.map((k) => k.slug)),
              isExtracting: false,
            }
          : prev,
      );
    } catch {
      setImagePopup((prev) => prev ? { ...prev, isExtracting: false } : prev);
    }
  }, [imagePopup]);

  const onTogglePopupKeyword = useCallback((slug: string) => {
    setImagePopup((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.selectedSlugs);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return { ...prev, selectedSlugs: next };
    });
  }, []);

  const onSelectAllPopupKeywords = useCallback(() => {
    setImagePopup((prev) => {
      if (!prev) return prev;
      const allSelected = prev.keywords.every((k) => prev.selectedSlugs.has(k.slug));
      const next = allSelected
        ? new Set<string>()
        : new Set(prev.keywords.map((k) => k.slug));
      return { ...prev, selectedSlugs: next };
    });
  }, []);

  const onCancelImagePopup = useCallback(() => {
    setImagePopup((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  // Apply Selected → 팝업 선택 키워드로 이미지 검색 실행
  const onApplyImageKeywords = useCallback(() => {
    if (!imagePopup) return;
    const { file, previewUrl, selectedSlugs } = imagePopup;
    setImagePopup(null);
    setActiveSlugs(new Set(selectedSlugs));
    setPhotoSearch((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return { file, previewUrl };
    });
  }, [imagePopup]);

  const onPhotoClear = useCallback(() => {
    setPhotoSearch((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    setActiveSlugs(new Set());
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setShowSuggestions(false);
    runSearch(query, Array.from(activeSlugs), 0);
  }, [query, activeSlugs, runSearch]);

  return (
    <div className="relative flex flex-col h-full bg-surface-50">
      {/* Reselect용 숨겨진 파일 인풋 */}
      <input
        ref={reselectInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onReselectFile(file);
            e.target.value = "";
          }
        }}
      />

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
          onFavoriteClick={() => router.push("/favorite?tab=portfolio")}
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
        onFavoriteClick={onFavoriteClick}
        emptyMessage={
          photoSearch
            ? "No visually similar portfolios"
            : query || activeSlugs.size > 0
              ? "No matching styles"
              : "No designers yet"
        }
      />

      {/* 검색 제안 패널 */}
      {showSuggestions && !showFilter && !imagePopup && (
        <StyleSearchSuggestions
          keywords={recommended}
          activeSlugs={activeSlugs}
          onToggleKeyword={onToggleKeyword}
          onClose={() => setShowSuggestions(false)}
        />
      )}

      {/* 이미지 키워드 팝업 */}
      {imagePopup && (
        <ImageKeywordsPopup
          previewUrl={imagePopup.previewUrl}
          stage={imagePopup.stage}
          keywords={imagePopup.keywords}
          selectedSlugs={imagePopup.selectedSlugs}
          isExtracting={imagePopup.isExtracting}
          onExtract={onExtractKeywords}
          onReselect={onReselect}
          onToggle={onTogglePopupKeyword}
          onSelectAll={onSelectAllPopupKeywords}
          onCancel={onCancelImagePopup}
          onApply={onApplyImageKeywords}
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
