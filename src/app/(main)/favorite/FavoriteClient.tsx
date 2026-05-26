"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FavoriteButton from "@/components/ui/FavoriteButton";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { toggleFavorite } from "@/lib/favorites/actions";
import { storageUrl } from "@/lib/storage";
import { getLanguageFlag } from "@/lib/languageFlag";
import type { FavoriteDesigner, FavoritePortfolio } from "@/lib/favorites/types";

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

function ProfileImage({ url, size }: { url: string | null; size: number }) {
  if (!url) return <PlaceholderAvatar size={size} />;
  return (
    <Image
      src={storageUrl(url)}
      alt=""
      width={size}
      height={size}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size, minWidth: size }}
    />
  );
}

function DesignerFavoriteCard({ designer }: { designer: FavoriteDesigner }) {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const languageKeywords = designer.keywords.filter((k) => k.categorySlug === "languages");
  const otherKeywords = designer.keywords.filter((k) => k.categorySlug !== "languages");

  if (removed) return null;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center gap-2 w-full">
        <button onClick={() => router.push(`/designer/${designer.id}`)} className="shrink-0">
          <ProfileImage url={designer.profileImageUrl} size={40} />
        </button>
        <button
          onClick={() => router.push(`/designer/${designer.id}`)}
          className="flex flex-col flex-1 min-w-0 text-left"
        >
          <p className="typo-h4 text-surface-950 truncate">{designer.displayName}</p>
          {designer.salonName && (
            <p className="typo-caption text-surface-600 truncate">{designer.salonName}</p>
          )}
        </button>
        <FavoriteButton
          virant={48}
          status="Active"
          onClick={() => {
            startTransition(async () => {
              await toggleFavorite("designer", designer.id);
              setRemoved(true);
            });
          }}
        />
      </div>

      <div className="flex gap-1 flex-wrap">
        {languageKeywords.map((kw) => {
          const flag = getLanguageFlag(kw.slug);
          return (
            <div
              key={kw.slug}
              className={`flex items-center h-7 gap-1 rounded-full bg-surface-200 typo-caption text-surface-800 ${
                flag ? "pl-1 pr-2.5" : "px-2"
              }`}
            >
              {flag && (
                <Image src={flag} alt="" width={20} height={20} className="rounded-full object-cover shrink-0" />
              )}
              {kw.name}
            </div>
          );
        })}
        {otherKeywords.map((kw) => (
          <div key={kw.slug} className="flex items-center h-7 px-2 rounded-full bg-surface-200 typo-caption text-surface-800">
            {kw.name}
          </div>
        ))}
      </div>

      {designer.portfolioImages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
          {designer.portfolioImages.map((img, i) => (
            <div key={i} className="rounded-2xl overflow-hidden shrink-0" style={{ width: 150, height: 180 }}>
              <Image
                src={storageUrl(img)}
                alt=""
                width={150}
                height={180}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioFavoriteCard({ portfolio }: { portfolio: FavoritePortfolio }) {
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (removed) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-surface-200" style={{ height: 250 }}>
      <Image
        src={storageUrl(portfolio.imagePath)}
        alt=""
        fill
        className="object-cover"
      />
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton
          virant={32}
          status="Active"
          onClick={() => {
            startTransition(async () => {
              await toggleFavorite("portfolio", portfolio.id);
              setRemoved(true);
            });
          }}
        />
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-4"
        style={{ background: "linear-gradient(to top, rgba(23,23,23,0.5), transparent)" }}
      >
        <div className="flex items-end gap-2">
          {portfolio.designerProfileImageUrl ? (
            <Image
              src={storageUrl(portfolio.designerProfileImageUrl)}
              alt=""
              width={32}
              height={32}
              className="rounded-full object-cover shrink-0"
            />
          ) : (
            <PlaceholderAvatar size={32} />
          )}
          <div className="flex flex-col min-w-0">
            <p className="typo-body2 text-white truncate">{portfolio.designerName}</p>
            {portfolio.salonName && (
              <p className="typo-caption2 text-white/80 truncate">{portfolio.salonName}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-surface-400">
      <svg width={48} height={48} viewBox="0 0 21.6941 20.6619" fill="currentColor" className="mb-3 opacity-40">
        <path d="M10.5638 0.201176C10.6574 -0.0670588 11.0367 -0.0670585 11.1303 0.201176L13.6069 7.29967C13.6481 7.41791 13.7585 7.49809 13.8837 7.50078L21.4001 7.66258C21.6841 7.66869 21.8013 8.02947 21.5751 8.20136L15.5894 12.7503C15.4897 12.826 15.4475 12.9558 15.4836 13.0757L17.6524 20.2742C17.7344 20.5462 17.4275 20.7692 17.1941 20.6072L11.0181 16.32C10.9153 16.2486 10.7789 16.2486 10.676 16.32L4.50002 20.6072C4.26665 20.7692 3.95975 20.5462 4.04171 20.2742L6.21051 13.0757C6.24664 12.9558 6.20449 12.826 6.10479 12.7503L0.119013 8.20136C-0.107175 8.02947 0.0100498 7.66869 0.294075 7.66258L7.81045 7.50078C7.93565 7.49809 8.046 7.41791 8.08725 7.29967L10.5638 0.201176Z" />
      </svg>
      <p className="typo-body2">No favorite {type}s yet</p>
    </div>
  );
}

type Props = {
  designers: FavoriteDesigner[];
  portfolios: FavoritePortfolio[];
};

export default function FavoriteClient({ designers, portfolios }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("designer");

  return (
    <div className="min-h-full flex flex-col bg-white">
      <div className="sticky top-0 z-20 bg-white pt-16 shrink-0">
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

        <SegmentedControl
          tabs={TABS}
          activeKey={activeTab}
          onChange={setActiveTab}
          className="mt-0"
        />
      </div>

      {activeTab === "designer" ? (
        designers.length > 0 ? (
          <div className="flex flex-col gap-8 p-4">
            {designers.map((d) => (
              <DesignerFavoriteCard key={d.id} designer={d} />
            ))}
          </div>
        ) : (
          <EmptyState type="designer" />
        )
      ) : portfolios.length > 0 ? (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {portfolios.map((p) => (
              <PortfolioFavoriteCard key={p.id} portfolio={p} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState type="portfolio" />
      )}
    </div>
  );
}
