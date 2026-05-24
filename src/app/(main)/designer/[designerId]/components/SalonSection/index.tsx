// Figma Ref: 365:13092 (Works at — Salon Card)
//
// 디자이너 소속 살롱 카드. 이미지 + 살롱명 + 주소 + Look Around 버튼.

import Link from "next/link";

function ArrowUpRight() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  salon: { id: string; name: string; address: string | null };
}

export default function SalonSection({ salon }: Props) {
  return (
    <section className="px-4 py-5 border-b border-surface-100 flex flex-col gap-3">
      <h2 className="typo-h4 text-surface-950">Works at</h2>

      <div>
        {/* 살롱 이미지 — TODO: salon.imageUrl 필드 추가 후 교체 */}
        <div className="relative h-[160px] rounded-2xl overflow-hidden bg-surface-200" />

        {/* 살롱 정보 */}
        <div className="flex gap-6 mt-3">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <h3 className="typo-h5 text-surface-950 truncate">{salon.name}</h3>
            {salon.address && (
              <p className="typo-body1 text-surface-600">{salon.address}</p>
            )}
          </div>
          <Link
            href={`/salon/${salon.id}`}
            aria-label={`${salon.name} 상세 페이지`}
            className="size-12 flex items-center justify-center shrink-0 text-surface-950"
          >
            <ArrowUpRight />
          </Link>
        </div>

        {/* Look Around */}
        <Link
          href={`/salon/${salon.id}`}
          className="mt-3 flex items-center justify-center w-full py-3 bg-surface-100 rounded-lg typo-button text-surface-950 active:bg-surface-200"
        >
          Look Around
        </Link>
      </div>
    </section>
  );
}
