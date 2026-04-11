"use client";

import { create } from "zustand";

export interface MatchedDesigner {
  designer: {
    id: number;
    name: string;
    profile_image: string | null;
    bio: string | null;
    role: string;
    languages: string[];
  };
  portfolio: {
    id: number;
    imageUrl: string;
  };
  similarity: number;
}

interface MatchStore {
  step: "upload" | "searching" | "results";
  imageFile: File | null;
  imagePreview: string | null;
  matches: MatchedDesigner[];
  isSearching: boolean;
  error: string | null;

  setImage: (file: File) => void;
  search: () => Promise<void>;
  reset: () => void;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  step: "upload",
  imageFile: null,
  imagePreview: null,
  matches: [],
  isSearching: false,
  error: null,

  setImage: (file: File) => {
    const preview = URL.createObjectURL(file);
    set({ imageFile: file, imagePreview: preview, error: null });
  },

  search: async () => {
    const { imageFile } = get();
    if (!imageFile) return;

    set({ step: "searching", isSearching: true, error: null });

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch("/api/search", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "검색에 실패했습니다.");
      }

      const data = await res.json();
      set({ step: "results", matches: data.matches, isSearching: false });
    } catch (err) {
      set({
        step: "upload",
        isSearching: false,
        error: err instanceof Error ? err.message : "알 수 없는 오류",
      });
    }
  },

  reset: () => {
    const { imagePreview } = get();
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    set({
      step: "upload",
      imageFile: null,
      imagePreview: null,
      matches: [],
      isSearching: false,
      error: null,
    });
  },
}));
