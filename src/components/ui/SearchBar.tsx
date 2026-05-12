"use client";

import { useEffect, useRef } from "react";

interface SearchBarProps {
  placeholder?: string;
  onClick?: () => void;
  className?: string;
  /** "default" = bg-white (지도 위 헤더), "muted" = action/unselected (필터 팝업 내부) */
  variant?: "default" | "muted";
  /** input 모드 — value를 주면 진짜 텍스트 입력으로 렌더. 없으면 button(클릭만). */
  value?: string;
  onChange?: (value: string) => void;
  /** input 모드일 때 마운트 직후 포커스 */
  autoFocus?: boolean;
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 14L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function SearchBar({
  placeholder = "Search salons",
  onClick,
  className = "",
  variant = "default",
  value,
  onChange,
  autoFocus = false,
}: SearchBarProps) {
  const bgClass = variant === "muted" ? "bg-surface-200" : "bg-white";
  const containerClass = `flex items-center justify-between h-[50px] rounded-full ${bgClass} pl-4 pr-2 min-w-0 flex-1 ${className}`;
  const inputRef = useRef<HTMLInputElement | null>(null);

  // autoFocus prop이 늦게 true가 되는 케이스(팝업이 마운트 후 표시)를 위해 effect로도 보장
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const isInputMode = value !== undefined;

  if (isInputMode) {
    return (
      <div className={containerClass}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 min-w-0 bg-transparent outline-none typo-body1 text-surface-900 placeholder:text-surface-400"
        />
        <span className="flex items-center justify-center size-8 text-surface-900 shrink-0">
          <SearchIcon />
        </span>
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className={containerClass}>
      <span className="typo-body1 text-surface-400 truncate">{placeholder}</span>
      <span className="flex items-center justify-center size-8 text-surface-900">
        <SearchIcon />
      </span>
    </button>
  );
}
