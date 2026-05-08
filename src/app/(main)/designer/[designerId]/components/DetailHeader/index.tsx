// Design Ref: §4.8, §6.1, FR-05, FR-20 — designer-detail
// Figma node: 433:6547 (designer upper bar)
//
// 좌측: ← + 프로필 사진 + 이름/살롱 정보
// 우측: 메시지 아이콘 → /messages/[designerId]

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/SafeImage";

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 11.5C21 16.1944 16.9706 20 12 20C10.5859 20 9.24389 19.6921 8.0429 19.1426L3 20L4.61749 15.7589C3.59933 14.5141 3 12.9722 3 11.5C3 6.80558 7.02944 3 12 3C16.9706 3 21 6.80558 21 11.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  name: string;
  profileImageUrl: string | null;
  salonLabel: string | null;
  messageHref: string;
}

export default function DetailHeader({ name, profileImageUrl, salonLabel, messageHref }: Props) {
  const router = useRouter();

  return (
    <div className="bg-surface-50 border-b border-surface-300/50">
      <div className="flex items-center justify-between h-14 pl-4 pr-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로가기"
            className="size-6 flex items-center justify-center text-surface-950"
          >
            <ChevronLeft />
          </button>
          <div className="size-8 rounded-full overflow-hidden border border-surface-500 flex-shrink-0">
            <SafeImage
              src={profileImageUrl}
              alt={name}
              fallback="profile"
              className="size-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="typo-h6 text-surface-950 truncate">{name}</span>
            {salonLabel && (
              <span className="typo-caption2 text-surface-600 truncate">{salonLabel}</span>
            )}
          </div>
        </div>
        <Link
          href={messageHref}
          aria-label="메시지"
          className="size-10 flex items-center justify-center rounded-full text-surface-950 active:bg-surface-100 flex-shrink-0"
        >
          <MessageIcon />
        </Link>
      </div>
    </div>
  );
}
