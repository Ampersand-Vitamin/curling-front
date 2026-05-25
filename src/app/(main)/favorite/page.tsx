"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FavoriteButton from "@/components/ui/FavoriteButton";
import SegmentedControl from "@/components/ui/SegmentedControl";

type KeywordChip = { label: string; flag?: string };

type MockDesigner = {
  id: string;
  name: string;
  salon: string;
  keywords: KeywordChip[];
};

type MockPortfolio = {
  id: string;
  designerName: string;
  salonName: string;
};

const MOCK_DESIGNERS: MockDesigner[] = [
  {
    id: "1",
    name: "Sejin",
    salon: "Salon de Sea",
    keywords: [
      { label: "English", flag: "/images/flags/british.svg" },
      { label: "Curly Hair" },
      { label: "Balayage" },
      { label: "Highlight" },
    ],
  },
  {
    id: "2",
    name: "Mina",
    salon: "Hair Studio M",
    keywords: [
      { label: "Korean", flag: "/images/flags/korean.svg" },
      { label: "Straight" },
      { label: "Color" },
    ],
  },
  {
    id: "3",
    name: "Amy",
    salon: "The Curl Bar",
    keywords: [
      { label: "English", flag: "/images/flags/british.svg" },
      { label: "Wavy Hair" },
      { label: "Perm" },
    ],
  },
];

const MOCK_PORTFOLIOS: MockPortfolio[] = [
  { id: "1", designerName: "Sejin", salonName: "Salon de Sea" },
  { id: "2", designerName: "Mina", salonName: "Hair Studio M" },
  { id: "3", designerName: "Amy", salonName: "The Curl Bar" },
  { id: "4", designerName: "Tae", salonName: "Studio T" },
  { id: "5", designerName: "Luna", salonName: "Luna Hair" },
  { id: "6", designerName: "Rin", salonName: "Rin's Salon" },
];

const TABS = [
  { key: "designer", label: "Designer" },
  { key: "portfolio", label: "Portfolio" },
];

function PlaceholderAvatar({ size }: { size: number }) {
  return (
    <div
      className="rounded-full bg-surface-300 text-surface-500 flex items-center justify-center shrink-0"
      style={{ width: size, height: size, minWidth: size }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="9" r="4" />
        <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
      </svg>
    </div>
  );
}

function DesignerFavoriteCard({ designer }: { designer: MockDesigner }) {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center gap-2 w-full">
        <PlaceholderAvatar size={40} />
        <div className="flex flex-col flex-1 min-w-0">
          <p className="typo-h4 text-surface-950 truncate">{designer.name}</p>
          <p className="typo-caption text-surface-600 truncate">{designer.salon}</p>
        </div>
        <FavoriteButton virant={48} />
      </div>

      <div className="flex gap-1 flex-wrap">
        {designer.keywords.map((kw, i) => (
          <div
            key={i}
            className={`flex items-center h-7 gap-1 rounded-full bg-surface-200 typo-caption text-surface-800 ${
              kw.flag ? "pl-1 pr-2.5" : "px-2"
            }`}
          >
            {kw.flag && (
              <Image src={kw.flag} alt="" width={20} height={20} className="rounded-full object-cover shrink-0" />
            )}
            {kw.label}
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-surface-200 shrink-0"
            style={{ width: 150, height: 180 }}
          />
        ))}
      </div>
    </div>
  );
}

function PortfolioFavoriteCard({ portfolio }: { portfolio: MockPortfolio }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-surface-200" style={{ height: 250 }}>
      {/* z-10 — sticky header is z-20, so this stays below it when scrolling */}
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton virant={32} />
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-4"
        style={{ background: "linear-gradient(to top, rgba(23,23,23,0.5), transparent)" }}
      >
        <div className="flex items-end gap-2">
          <PlaceholderAvatar size={32} />
          <div className="flex flex-col min-w-0">
            <p className="typo-body2 text-white truncate">{portfolio.designerName}</p>
            <p className="typo-caption2 text-white/80 truncate">{portfolio.salonName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FavoritePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("designer");

  return (
    <div className="min-h-full flex flex-col bg-white">
      {/* Sticky header — z-20 so card buttons (z-10) stay below when scrolling */}
      <div className="sticky top-0 z-20 bg-white pt-16 shrink-0">
        {/* Title row: "Favorite" centered, back button absolute-left */}
        <div className="relative flex items-center justify-center h-6 mx-4">
          <button
            onClick={() => router.back()}
            className="absolute left-0 flex items-center justify-center"
            style={{ width: 24, height: 24 }}
          >
            <img src="/icons/chevron-left.svg" alt="back" width={16} height={16} />
          </button>
          <p className="typo-h6 text-surface-600">Favorite</p>
        </div>

        {/* Segmented control */}
        <SegmentedControl
          tabs={TABS}
          activeKey={activeTab}
          onChange={setActiveTab}
          className="mt-0"
        />
      </div>

      {/* Content */}
      {activeTab === "designer" ? (
        <div className="flex flex-col gap-8 p-4">
          {MOCK_DESIGNERS.map((d) => (
            <DesignerFavoriteCard key={d.id} designer={d} />
          ))}
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {MOCK_PORTFOLIOS.map((p) => (
              <PortfolioFavoriteCard key={p.id} portfolio={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
