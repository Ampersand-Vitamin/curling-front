"use client";

import { useCallback, useEffect, useState } from "react";
import StyleTagFilterBar from "./StyleTagFilterBar";
import StyleImageGrid from "./StyleImageGrid";
import { STYLE_TAGS, fetchStyleImages } from "@/lib/style/styleImages";
import type { StyleImage } from "@/types/styleTab";

const ALL_SLUG = "all";

export default function StyleTabView() {
  const [activeTagSlug, setActiveTagSlug] = useState<string>(ALL_SLUG);
  const [images, setImages] = useState<StyleImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadImages = useCallback(async (slug: string) => {
    setIsLoading(true);
    try {
      const result = await fetchStyleImages(slug === ALL_SLUG ? undefined : slug);
      setImages(result);
    } catch (err) {
      console.warn("[StyleTabView] 이미지 로드 실패", err);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages(activeTagSlug);
  }, [activeTagSlug, loadImages]);

  const handleTagChange = useCallback((slug: string) => {
    setActiveTagSlug(slug);
  }, []);

  return (
    <div className="flex flex-col bg-surface-50">
      <div className="sticky top-0 z-10 bg-surface-50 pt-3 pb-2">
        <StyleTagFilterBar
          tags={STYLE_TAGS}
          activeSlug={activeTagSlug}
          onChange={handleTagChange}
        />
      </div>
      <StyleImageGrid images={images} isLoading={isLoading} />
    </div>
  );
}
