// Design Ref: §4.10, §6.3, FR-07 — designer-detail
//
// 프로필 썸네일 + 이름·역할·별점·bio

import SafeImage from "@/components/SafeImage";
import type { DesignerDetail } from "@/lib/designers";

function StarSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-alert-500">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

interface Props {
  designer: DesignerDetail;
}

export default function DesignerInfoSection({ designer }: Props) {
  const formattedReviews = designer.reviewCount.toLocaleString();

  return (
    <section className="flex gap-3 px-4 py-4 border-b border-surface-100">
      <div className="size-[60px] rounded-full overflow-hidden bg-surface-300 shrink-0">
        <SafeImage
          src={designer.profileImageUrl}
          alt={designer.displayName}
          fallback="profile"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <h1 className="typo-h5 text-surface-950">{designer.displayName}</h1>
          <span className="typo-caption text-surface-500">{designer.role}</span>
        </div>

        {designer.reviewCount > 0 && (
          <div className="flex items-center gap-1">
            <StarSmall />
            <span className="typo-caption2 text-surface-700">
              {designer.ratingAvg.toFixed(1)} ({formattedReviews})
            </span>
          </div>
        )}

        {designer.bio && (
          <p className="typo-body2 text-surface-700 mt-1">{designer.bio}</p>
        )}
      </div>
    </section>
  );
}
