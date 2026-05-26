"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import FavoriteButton from "@/components/ui/FavoriteButton";
import type { PortfolioDetailData } from "./actions";
import { toggleFavoritePortfolio } from "./actions";

interface Props {
  portfolio: PortfolioDetailData;
}

function RelatedCard({
  id,
  imageUrl,
  avatarUrl,
  designerName,
  isFavorited,
  onFavoriteToggle,
}: {
  id: string;
  imageUrl: string;
  avatarUrl: string | null;
  designerName: string;
  isFavorited: boolean;
  onFavoriteToggle: (id: string) => void;
}) {
  return (
    <Link href={`/portfolio/${id}`} className="flex-shrink-0 relative overflow-hidden rounded-lg" style={{ width: 114, height: 156 }}>
      <SafeImage
        src={imageUrl}
        alt={`${designerName} portfolio`}
        fallback="portfolio"
        className="w-full h-full object-cover"
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: 72, background: "linear-gradient(to bottom, rgba(23,23,23,0), rgba(23,23,23,0.7))" }}
      />
      <div className="absolute bottom-0 inset-x-0 px-1.5 pb-1.5 flex items-end justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <div className="size-5 rounded-full overflow-hidden bg-surface-300 shrink-0">
            <SafeImage
              src={avatarUrl}
              alt=""
              fallback="profile"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="typo-caption2 text-white truncate">{designerName}</p>
        </div>
        <FavoriteButton
          virant={20}
          status={isFavorited ? "Active" : "Default"}
          onClick={(e) => {
            e.preventDefault();
            onFavoriteToggle(id);
          }}
        />
      </div>
    </Link>
  );
}

export default function PortfolioDetailClient({ portfolio: initial }: Props) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initial.isFavorited);
  const [otherFavs, setOtherFavs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initial.otherPortfolios.map((p) => [p.id, p.isFavorited]))
  );
  const [, startTransition] = useTransition();

  function handleMainFavorite() {
    const next = !isFavorited;
    setIsFavorited(next);
    startTransition(async () => {
      try {
        await toggleFavoritePortfolio(initial.id);
      } catch {
        setIsFavorited(!next);
      }
    });
  }

  function handleRelatedFavorite(id: string) {
    const next = !otherFavs[id];
    setOtherFavs((prev) => ({ ...prev, [id]: next }));
    startTransition(async () => {
      try {
        await toggleFavoritePortfolio(id);
      } catch {
        setOtherFavs((prev) => ({ ...prev, [id]: !next }));
      }
    });
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="relative flex items-center justify-center h-14 px-4 shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-4 flex items-center justify-center size-10"
          aria-label="Go back"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/arrow-left.svg" alt="" width={24} height={24} />
        </button>
        <h1 className="typo-h6 text-surface-950">Portfolio</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="flex flex-col gap-8 px-4 py-6">

          {/* Designer info row */}
          <Link href={`/designer/${initial.designerId}`} className="flex items-center gap-3">
            <div className="size-10 rounded-full overflow-hidden bg-surface-300 shrink-0">
              <SafeImage
                src={initial.avatarUrl}
                alt={initial.designerName}
                fallback="profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="typo-h6 text-surface-600">{initial.designerName}</p>
              {initial.salonName && (
                <p className="typo-caption text-surface-400">{initial.salonName}</p>
              )}
            </div>
            <div className="size-8 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/more-horizontal.svg" alt="" width={20} height={20} />
            </div>
          </Link>

          {/* Main image */}
          <div className="w-full rounded-2xl overflow-hidden bg-surface-100" style={{ height: 400 }}>
            <SafeImage
              src={initial.imageUrl}
              alt="Portfolio"
              fallback="portfolio"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info section: title + favorite */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="typo-h5 text-surface-950">{initial.designerName}</p>
            </div>
            <FavoriteButton
              virant={48}
              status={isFavorited ? "Active" : "Default"}
              onClick={handleMainFavorite}
            />
          </div>

          {/* Designer Profile button */}
          <Link
            href={`/designer/${initial.designerId}`}
            className="flex items-center justify-center w-full py-4 rounded-lg typo-button text-white"
            style={{ backgroundColor: "var(--color-surface-800)" }}
          >
            Designer Profile
          </Link>

          {/* From [designer] section */}
          {initial.otherPortfolios.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="typo-h4 text-surface-950">From {initial.designerName}</h2>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {initial.otherPortfolios.map((p) => (
                  <RelatedCard
                    key={p.id}
                    id={p.id}
                    imageUrl={p.imageUrl}
                    avatarUrl={initial.avatarUrl}
                    designerName={initial.designerName}
                    isFavorited={otherFavs[p.id] ?? false}
                    onFavoriteToggle={handleRelatedFavorite}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
