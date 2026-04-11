"use client";

import { useCallback, useRef } from "react";
import { useMatchStore } from "../store/matchStore";

export default function ImageUploader() {
  const { imagePreview, setImage, search, isSearching, error } =
    useMatchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setImage(file);
    },
    [setImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* 드롭존 */}
      <button
        type="button"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="w-full aspect-square max-w-[320px] rounded-2xl border-2 border-dashed border-surface-300 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-surface-400 transition-colors overflow-hidden bg-surface-900"
      >
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="업로드 미���보기"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              className="text-surface-400"
            >
              <path
                d="M12 16V8m0 0l-3 3m3-3l3 3M3 16v1a2 2 0 002 2h14a2 2 0 002-2v-1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-surface-400 text-sm">
              헤어 이미지를 드래그하거나 클릭해서 업로드
            </p>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {/* 에러 메시지 */}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {/* 매칭 시작 버튼 */}
      {imagePreview && (
        <button
          type="button"
          onClick={search}
          disabled={isSearching}
          className="w-full max-w-[320px] py-3 rounded-xl bg-surface-50 text-surface-950 font-medium text-sm disabled:opacity-50 transition-opacity"
        >
          {isSearching ? "매칭 중..." : "매칭 시작"}
        </button>
      )}
    </div>
  );
}
