// Figma Ref: 608:18876 / 639:113193 — Salon Carousel (Big variant)
// PullBar 활성 필터별 살롱 매칭 섹션. DesignerCarousel과 동일한 정렬·UI 패턴.
import { useMemo } from "react";
import Link from "next/link";
import { haversineKm, type LatLng } from "@/lib/geo";
import { getLanguageFlag } from "@/lib/languageFlag";
import type { Salon } from "@/types/salon";

export interface SalonCarouselItem {
  salon: Salon;
  /** 카드 하단에 노출할 키워드 칩 (활성 필터에서 매칭된 slug 기반 + 보강) */
  chips: { slug: string; name: string }[];
}

interface Props {
  items: SalonCarouselItem[];
  title: string;
  showViewMore?: boolean;
  onViewMore?: () => void;
  emptyMessage?: string;
  userLocation?: LatLng | null;
}

function FlagIcon({ src }: { src: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt="" width={20} height={20} className="size-5 rounded-full shrink-0" />
  );
}

function FavoriteButton() {
  return (
    <button
      type="button"
      aria-label="favorite"
      className="shrink-0 flex items-center justify-center p-1 rounded-full backdrop-blur-sm bg-surface-white/30"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/bookmark.svg"
        alt=""
        width={24}
        height={24}
        className="[filter:brightness(0)_invert(1)]"
        onError={(e) => {
          // 아이콘 없을 때 placeholder 도형
          (e.target as HTMLImageElement).style.visibility = "hidden";
        }}
      />
    </button>
  );
}

export default function SalonCarousel({
  items,
  title,
  showViewMore = false,
  onViewMore,
  emptyMessage = "매칭되는 살롱이 아직 없어요.",
  userLocation = null,
}: Props) {
  // 거리순 정렬. 좌표 없는 살롱은 뒤로.
  const sortedItems = useMemo(() => {
    if (!userLocation) return items;
    return [...items].sort((a, b) => {
      const aLatLng = { lat: a.salon.latitude, lng: a.salon.longitude };
      const bLatLng = { lat: b.salon.latitude, lng: b.salon.longitude };
      return (
        haversineKm(userLocation, aLatLng) - haversineKm(userLocation, bLatLng)
      );
    });
  }, [items, userLocation]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-[10px]">
        <p className="flex-1 typo-h5 text-surface-950">{title}</p>
        {showViewMore &&
          (onViewMore ? (
            <button
              type="button"
              onClick={onViewMore}
              className="typo-caption text-surface-400 underline shrink-0"
            >
              View more
            </button>
          ) : (
            <span className="typo-caption text-surface-400 underline shrink-0">
              View more
            </span>
          ))}
      </div>
      {sortedItems.length === 0 ? (
        <p className="typo-body2 text-surface-500">{emptyMessage}</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {sortedItems.map((item) => (
            <SalonBigCard
              key={item.salon.id}
              item={item}
              userLocation={userLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SalonBigCard({
  item,
  userLocation,
}: {
  item: SalonCarouselItem;
  userLocation: LatLng | null;
}) {
  const { salon, chips } = item;
  const distanceKm = userLocation
    ? haversineKm(userLocation, { lat: salon.latitude, lng: salon.longitude })
    : null;
  const distanceLabel = distanceKm != null ? `${distanceKm.toFixed(1)} km` : null;
  // address: "Gangnam, Seoul" 같은 첫 콤마 앞 부분만 짧게 (Figma 톤). 없으면 그대로.
  const shortAddress = salon.address.split(",").slice(0, 2).join(",").trim();

  return (
    <Link
      href={`/salon/${salon.id}`}
      prefetch={false}
      className="relative block w-[324px] h-[224px] rounded-2xl overflow-hidden shrink-0 bg-surface-300"
    >
      {/* Salon image — DB에 image 컬럼 추가 전까지 placeholder */}
      <div className="absolute inset-0 bg-surface-200" />
      {/* 하단 그라디언트 + 정보 */}
      <div className="absolute inset-x-0 bottom-0 flex gap-[10px] items-end pl-4 pr-[10px] py-[10px] bg-gradient-to-b from-transparent to-surface-950/50 backdrop-blur-[2px]">
        <div className="flex-1 min-w-0 flex flex-col gap-[10px]">
          <div className="flex flex-col">
            <p className="typo-h6 text-surface-white truncate">{salon.name}</p>
            <div className="flex gap-1 typo-caption text-surface-white/80">
              {distanceLabel && (
                <>
                  <span>{distanceLabel}</span>
                  <span>|</span>
                </>
              )}
              <span className="truncate">{shortAddress}</span>
            </div>
          </div>
          {chips.length > 0 && (
            <div className="flex gap-1 items-start overflow-hidden">
              {chips.slice(0, 3).map((c) => {
                const flag = getLanguageFlag(c.slug);
                return (
                  <span
                    key={c.slug}
                    className="flex items-center gap-1 h-7 px-2 py-1.5 bg-surface-white rounded-full border-[0.5px] border-surface-300 shrink-0"
                  >
                    {flag && <FlagIcon src={flag} />}
                    <span className="typo-caption text-surface-700 whitespace-nowrap">
                      {c.name}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <FavoriteButton />
      </div>
    </Link>
  );
}
