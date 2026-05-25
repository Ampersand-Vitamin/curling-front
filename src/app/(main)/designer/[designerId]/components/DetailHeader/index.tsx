// Design Ref: §4.8, §6.1, FR-05, FR-20 — designer-detail
// Figma node: 433:6547 (designer upper bar)
//
// 좌측: ← + 프로필 사진 + 이름/살롱 정보
// 우측: 메시지 아이콘 → /messages/new/[designerId]

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/SafeImage";

interface Props {
  name: string;
  profileImageUrl: string | null;
  salonLabel: string | null;
  messageHref: string;
}

export default function DetailHeader({ name, profileImageUrl, salonLabel, messageHref }: Props) {
  const router = useRouter();

  return (
    <div className="bg-surface-white">
      <div className="flex items-center justify-between pl-4 pr-3 pt-4 pb-3">
        <div className="flex items-center gap-[10px] min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로가기"
            className="p-2 rounded-full shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/chevron-left.svg" alt="" width={24} height={24} />
          </button>
          <div className="flex items-center gap-1 min-w-0">
            <div className="size-8 rounded-full overflow-hidden bg-surface-100 shrink-0">
              <SafeImage
                src={profileImageUrl}
                alt={name}
                fallback="profile"
                className="size-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="typo-h6 text-surface-600 truncate">{name}</span>
              {salonLabel && (
                <span className="typo-caption text-surface-400 truncate">
                  {salonLabel}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={messageHref}
          aria-label="메시지"
          className="p-2 rounded-full active:bg-surface-100 shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/chat.svg" alt="" width={24} height={24} />
        </Link>
      </div>
    </div>
  );
}
