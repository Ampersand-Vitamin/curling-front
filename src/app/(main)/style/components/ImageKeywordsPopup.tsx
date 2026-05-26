"use client";

import type { RecommendedKeyword } from "@/types/style";

interface ImageKeywordsPopupProps {
  previewUrl: string;
  stage: "initial" | "keywords";
  keywords: RecommendedKeyword[];
  selectedSlugs: Set<string>;
  isExtracting: boolean;
  onExtract: () => void;
  onReselect: () => void;
  onToggle: (slug: string) => void;
  onSelectAll: () => void;
  onCancel: () => void;
  onApply: () => void;
}

function XSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="animate-spin">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function ImageKeywordsPopup({
  previewUrl,
  stage,
  keywords,
  selectedSlugs,
  isExtracting,
  onExtract,
  onReselect,
  onToggle,
  onSelectAll,
  onCancel,
  onApply,
}: ImageKeywordsPopupProps) {
  const allSelected = keywords.length > 0 && keywords.every((k) => selectedSlugs.has(k.slug));

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm" onClick={onCancel} />

      {/* 바텀시트 카드 */}
      <div className="relative z-10 bg-surface-50 rounded-t-3xl px-5 pt-6 pb-8 flex flex-col gap-5">
        <h2 className="typo-h5 text-center text-surface-900">Keywords Recommendation</h2>

        {/* 이미지 미리보기 */}
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Uploaded style"
            className={`rounded-2xl object-cover transition-all ${
              stage === "initial" ? "w-44 h-44" : "w-24 h-24"
            }`}
          />
          {stage === "initial" && (
            <button
              type="button"
              onClick={onReselect}
              className="typo-caption text-surface-400 hover:text-surface-600 transition-colors"
            >
              Reselect
            </button>
          )}
        </div>

        {stage === "initial" ? (
          /* ── 1단계: Extract Keywords ── */
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onExtract}
              disabled={isExtracting}
              className="w-full h-12 rounded-full border border-surface-900 bg-surface-50 text-surface-900 typo-button flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <Spinner />
                  Extracting…
                </>
              ) : (
                "Extract Keywords"
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 typo-button text-surface-400 text-center"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* ── 2단계: 키워드 선택 ── */
          <div className="flex flex-col gap-4">
            {/* Select All + 키워드 칩 */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSelectAll}
                className={`px-3.5 py-1.5 rounded-full typo-caption border transition-colors ${
                  allSelected
                    ? "bg-surface-900 text-white border-surface-900"
                    : "bg-surface-100 text-surface-700 border-surface-300"
                }`}
              >
                Select All
              </button>

              {keywords.map((kw) => {
                const active = selectedSlugs.has(kw.slug);
                return (
                  <button
                    key={kw.slug}
                    type="button"
                    onClick={() => onToggle(kw.slug)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full typo-caption border transition-colors ${
                      active
                        ? "bg-surface-900 text-white border-surface-900"
                        : "bg-surface-100 text-surface-700 border-surface-300"
                    }`}
                  >
                    {kw.label}
                    {active && <XSmallIcon />}
                  </button>
                );
              })}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 h-12 rounded-full bg-surface-200 text-surface-700 typo-button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onApply}
                disabled={selectedSlugs.size === 0}
                className="flex-1 h-12 rounded-full bg-secondary-400 text-white typo-button disabled:opacity-40"
              >
                Apply Selected
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
