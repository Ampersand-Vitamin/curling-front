type FavoriteButtonProps = {
  virant?: 48 | 40 | 32 | 20;
  status?: "Default" | "Active";
  onClick?: () => void;
  className?: string;
};

const STAR_PATH =
  "M10.5638 0.201176C10.6574 -0.0670588 11.0367 -0.0670585 11.1303 0.201176L13.6069 7.29967C13.6481 7.41791 13.7585 7.49809 13.8837 7.50078L21.4001 7.66258C21.6841 7.66869 21.8013 8.02947 21.5751 8.20136L15.5894 12.7503C15.4897 12.826 15.4475 12.9558 15.4836 13.0757L17.6524 20.2742C17.7344 20.5462 17.4275 20.7692 17.1941 20.6072L11.0181 16.32C10.9153 16.2486 10.7789 16.2486 10.676 16.32L4.50002 20.6072C4.26665 20.7692 3.95975 20.5462 4.04171 20.2742L6.21051 13.0757C6.24664 12.9558 6.20449 12.826 6.10479 12.7503L0.119013 8.20136C-0.107175 8.02947 0.0100498 7.66869 0.294075 7.66258L7.81045 7.50078C7.93565 7.49809 8.046 7.41791 8.08725 7.29967L10.5638 0.201176Z";

export default function FavoriteButton({
  virant = 48,
  status = "Default",
  onClick,
  className,
}: FavoriteButtonProps) {
  const isActive = status === "Active";
  const iconSize = virant === 20 ? 16 : 24;

  const containerCls =
    virant === 48
      ? `${isActive ? "bg-secondary-50" : "bg-surface-200"} backdrop-blur-[2px] p-3 size-12`
      : virant === 40
        ? "p-1 size-10"
        : virant === 32
          ? "bg-white/30 backdrop-blur-[2px] p-1 size-8"
          : "bg-white/30 backdrop-blur-[2px] size-5";

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center rounded-full shrink-0 ${containerCls} ${className ?? ""}`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 21.6941 20.6619"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={STAR_PATH}
          fill={isActive ? "var(--color-secondary-400)" : "var(--color-surface-500)"}
        />
      </svg>
    </button>
  );
}
