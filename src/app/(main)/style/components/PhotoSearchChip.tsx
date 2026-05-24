"use client";

// Design Ref: §6.3 — 사진 검색 모드에서 input 영역을 대체하는 라벨.
//   round thumbnail + 파일명 + 제거(X)
//   디자인 토큰만 사용 (surface-*, typo-*).

interface PhotoSearchChipProps {
  previewUrl: string;
  fileName: string;
  onRemove: () => void;
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function PhotoSearchChip({
  previewUrl,
  fileName,
  onRemove,
}: PhotoSearchChipProps) {
  return (
    <div
      role="group"
      aria-label="Photo search input"
      className="flex items-center gap-2 h-12 rounded-full bg-surface-200 pl-1 pr-1 min-w-0 flex-1"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt=""
        aria-hidden="true"
        className="size-10 rounded-full object-cover shrink-0"
      />
      <span className="flex-1 min-w-0 typo-body2 text-surface-900 truncate">
        {fileName}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Clear photo search"
        className="flex items-center justify-center size-9 rounded-full text-surface-900 shrink-0"
      >
        <XIcon />
      </button>
    </div>
  );
}
