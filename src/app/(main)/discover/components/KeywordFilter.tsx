// Design Ref: §3.2 — 필터 칩 (activated/default, chevron 유무)
// Plan D-7, FR-13, FR-14 — onRemove prop으로 X 삭제 모드 확장
"use client";

interface KeywordFilterProps {
  label: string;
  activated?: boolean;
  showChevron?: boolean;
  variant?: "outlined" | "filled";
  onClick?: () => void;
  /** 주어지면 activated 강제 + 우측 pr-[5px] + chevron 대신 X 버튼 렌더 */
  onRemove?: () => void;
  /** 텍스트 좌측에 렌더할 아이콘 (예: 국기 svg). 있으면 좌측 패딩 축소 */
  leadingIcon?: React.ReactNode;
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className}>
      <path d="M3.25 5.25L6.5 8.5L9.75 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Design Ref: Figma 374:10503 — 8px X glyph
function XIcon({ className }: { className?: string }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={className}>
      <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function KeywordFilter({
  label,
  activated = false,
  showChevron = false,
  variant = "outlined",
  onClick,
  onRemove,
  leadingIcon,
}: KeywordFilterProps) {
  const isRemovable = !!onRemove;
  // Plan FR-13: onRemove 있으면 activated 강제
  const effectiveActivated = isRemovable || activated;

  // 그룹 칩(chevron 있음) 펼침 상태는 surface-900으로 구분 — 일반 키워드 선택과 시각 구분
  const isExpandedGroupChip = showChevron && activated && !isRemovable;

  const defaultStyle =
    variant === "filled"
      ? "bg-surface-200 text-surface-800"
      : "bg-surface-200 text-surface-800";

  const activatedStyle = isExpandedGroupChip
    ? "bg-surface-900 text-white"
    : "bg-primary-400 text-white";

  // leadingIcon 있으면 좌측 4px (Figma 572:7338) — 국기 칩 패턴
  // 그 외엔 기존 규칙: removable 우측 5px / 일반 10px
  const leftPadding = leadingIcon ? "pl-[4px]" : "pl-[10px]";
  const rightPadding = isRemovable ? "pr-[5px]" : "pr-[10px]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full ${leftPadding} ${rightPadding} py-[6px] typo-caption capitalize transition-colors shrink-0 ${
        effectiveActivated ? activatedStyle : defaultStyle
      }`}
    >
      {leadingIcon}
      {label}
      {isRemovable && (
        // Plan FR-14: 원형 X 버튼. <button> 중첩 방지 위해 <span role="button">.
        // stopPropagation으로 칩 전체 onClick과 분리
        <span
          role="button"
          tabIndex={0}
          aria-label={`Remove ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove!();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              onRemove!();
            }
          }}
          className="flex items-center justify-center size-4 rounded-full bg-primary-300 text-white"
        >
          <XIcon className="size-2" />
        </span>
      )}
      {showChevron && !isRemovable && (
        <ChevronDown
          className={`size-[13px] transition-transform duration-200 ${
            effectiveActivated ? "rotate-180" : ""
          }`}
        />
      )}
    </button>
  );
}
