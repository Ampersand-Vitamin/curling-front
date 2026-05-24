// Design Ref: §3.5, §4.22, FR-16 — 섹션 타이틀 + 카드 수평 스크롤 리스트
// filter-match PDCA: title 커스터마이즈 가능 (Best Match for you 외 키워드별 섹션 재사용)
// distance-sort PDCA: 기본 정렬은 사용자 위치 기준 가까운 거리순.
//   Best Match는 추후 user 테이블 + 가중치 정렬로 교체 예정 (현재는 동일하게 거리순).
import { useMemo } from "react";
import DesignerCard from "./DesignerCard";
import { storageUrl } from "@/lib/storage";
import { haversineKm, type LatLng } from "@/lib/geo";
import { selectDesignerPortfolioImage } from "@/lib/designers/selectPortfolioImage";
import type { DesignerListItem } from "@/lib/designers";

interface Props {
  designers: DesignerListItem[];
  /** 섹션 타이틀 — 기본 "Best Match for you" */
  title?: string;
  /** 우측 상단 "View more" 노출 여부 */
  showViewMore?: boolean;
  /** "View more" 클릭 핸들러 — 미지정 시 비활성 텍스트 */
  onViewMore?: () => void;
  /** 빈 상태 메시지 */
  emptyMessage?: string;
  /** 사용자 현재 위치 — 있으면 가까운 거리순 정렬, 없으면 자연 순서 */
  userLocation?: LatLng | null;
  /** 현재 섹션/필터와 맞는 portfolio 이미지를 우선 선택 */
  portfolioKeywordSlugs?: string[];
}

export default function DesignerCarousel({
  designers,
  title = "Best Match for you",
  showViewMore = false,
  onViewMore,
  emptyMessage = "매칭되는 디자이너가 아직 없어요.",
  userLocation = null,
  portfolioKeywordSlugs = [],
}: Props) {
  // 기본 정렬: 사용자 위치로부터 가까운 살롱 순.
  // 살롱 좌표가 없는 디자이너는 뒤로 밀어둠.
  // (Best Match도 우선 동일 로직 — 추후 가중치 정렬로 교체)
  const sortedDesigners = useMemo(() => {
    if (!userLocation) return designers;
    return [...designers].sort((a, b) => {
      const da = a.salonLatLng
        ? haversineKm(userLocation, a.salonLatLng)
        : Number.POSITIVE_INFINITY;
      const db = b.salonLatLng
        ? haversineKm(userLocation, b.salonLatLng)
        : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [designers, userLocation]);

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
      {sortedDesigners.length === 0 ? (
        <p className="typo-body2 text-surface-500">{emptyMessage}</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {sortedDesigners.map((d) => (
            <DesignerCard
              key={d.id}
              id={d.id}
              name={d.displayName}
              role={d.role}
              languages={d.languages}
              profileImage={d.profileImageUrl ? storageUrl(d.profileImageUrl) : ""}
              portfolioImage={
                selectDesignerPortfolioImage(d, portfolioKeywordSlugs)
              }
              highlightMessage={d.highlightMessage ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
