"use client";

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "dark" | "light";
  badge?: number;
  className?: string;
}

export default function IconButton({
  children,
  onClick,
  variant = "light",
  badge,
  className = "",
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center size-[46px] rounded-full shrink-0 transition-colors ${
        variant === "dark"
          ? "bg-surface-900 text-white"
          : "bg-white text-surface-900"
      } ${className}`}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute top-0 -right-0.5 flex items-center justify-center size-[18px] rounded-full bg-secondary-400 text-white typo-caption2">
          {badge}
        </span>
      )}
    </button>
  );
}
