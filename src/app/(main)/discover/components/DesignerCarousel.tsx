// Design Ref: §3.5, §4.22, FR-16 — 섹션 타이틀 + 카드 수평 스크롤 리스트
// designer-detail PDCA: MOCK_DESIGNERS 제거, props 로 실 DB 데이터 받음
import DesignerCard from "./DesignerCard";
import { storageUrl } from "@/lib/storage";
import type { DesignerListItem } from "@/lib/designers";

interface Props {
  designers: DesignerListItem[];
}

export default function DesignerCarousel({ designers }: Props) {
  if (designers.length === 0) {
    return (
      <div className="flex flex-col gap-4 pb-20">
        <p className="typo-h5 text-surface-950">Best Match for you</p>
        <p className="typo-body2 text-surface-500">
          매칭되는 디자이너가 아직 없어요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      <p className="typo-h5 text-surface-950">Best Match for you</p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {designers.map((d) => (
          <DesignerCard
            key={d.id}
            id={d.id}
            name={d.displayName}
            role={d.role}
            languages={d.languages}
            profileImage={d.profileImageUrl ? storageUrl(d.profileImageUrl) : ""}
            portfolioImage={
              d.portfolioImages[0] ? storageUrl(d.portfolioImages[0]) : ""
            }
            highlightMessage={d.highlightMessage ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}
