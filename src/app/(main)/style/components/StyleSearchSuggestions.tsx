"use client";

import type { RecommendedKeyword } from "@/types/style";

// ── 더미 데이터 (데이터 준비 후 API로 교체) ──────────────────────

const TRENDING_ITEMS = [
  { id: "t1", label: "Women Layered Cut" },
  { id: "t2", label: "Bob Cut" },
  { id: "t3", label: "Balayage" },
  { id: "t4", label: "Curly Layers" },
];

type RankDirection = "up" | "down" | null;
type RankItem = { rank: number; name: string; change: number | null; direction: RankDirection };

const RANKING_ITEMS: RankItem[] = [
  { rank: 1, name: "Female Layered Cut", change: 1,    direction: "up" },
  { rank: 2, name: "Balayage",           change: 1,    direction: "down" },
  { rank: 3, name: "Scalp Treatment",    change: null, direction: null },
  { rank: 4, name: "Highlights",         change: null, direction: null },
  { rank: 5, name: "Bob Cut",            change: 3,    direction: "up" },
];

// ── 아이콘 ──────────────────────────────────────────────────────

function UpArrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M5 2v6M2 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Props ────────────────────────────────────────────────────────

interface StyleSearchSuggestionsProps {
  keywords: RecommendedKeyword[];
  activeSlugs: Set<string>;
  onToggleKeyword: (slug: string) => void;
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────

export default function StyleSearchSuggestions({
  keywords,
  activeSlugs,
  onToggleKeyword,
  onClose,
}: StyleSearchSuggestionsProps) {
  return (
    <>
      {/* 딤 배경 — 패널 바깥 클릭 시 닫기 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-20"
        onClick={onClose}
      />

      {/* 제안 패널 */}
      <div className="absolute inset-x-3 top-[76px] z-30 rounded-2xl bg-surface-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] overflow-hidden">
        <div className="overflow-y-auto max-h-[70vh] px-4 py-4 flex flex-col gap-5">

          {/* Recommended */}
          <section>
            <h3 className="typo-h6 text-surface-900 mb-2.5">Recommended</h3>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw) => {
                const active = activeSlugs.has(kw.slug);
                return (
                  <button
                    key={kw.slug}
                    type="button"
                    onClick={() => onToggleKeyword(kw.slug)}
                    className={`flex items-center h-7 px-3 rounded-full typo-caption transition-colors capitalize ${
                      active
                        ? "bg-secondary-400 text-white"
                        : "bg-surface-100 text-surface-700"
                    }`}
                  >
                    {kw.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Trending Style */}
          <section>
            <h3 className="typo-h6 text-surface-900 mb-2.5">Trending Style</h3>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-0.5">
              {TRENDING_ITEMS.map((item) => (
                <div key={item.id} className="flex flex-col gap-1.5 shrink-0 w-[72px]">
                  <div className="w-[72px] h-[90px] rounded-xl bg-surface-200" />
                  <p className="typo-caption2 text-surface-700 text-center leading-tight">{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Ranking */}
          <section className="pb-1">
            <h3 className="typo-h6 text-surface-900 mb-1">Ranking</h3>
            <div className="flex flex-col divide-y divide-surface-100">
              {RANKING_ITEMS.map((item) => (
                <div key={item.rank} className="flex items-center gap-3 py-2.5">
                  <span className="typo-caption text-surface-400 w-4 text-center shrink-0">
                    {item.rank}
                  </span>
                  <span className="flex-1 typo-body2 text-surface-900">{item.name}</span>
                  {item.change !== null && item.direction !== null && (
                    <div
                      className={`flex items-center gap-0.5 typo-caption2 shrink-0 ${
                        item.direction === "up" ? "text-secondary-500" : "text-accent-500"
                      }`}
                    >
                      {item.direction === "up" ? <UpArrow /> : <DownArrow />}
                      <span>{item.change}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
