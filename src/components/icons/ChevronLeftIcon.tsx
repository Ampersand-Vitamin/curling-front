export function ChevronLeftIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M15 5.84091L13.635 4.5L6 12L13.635 19.5L15 18.1591L8.73008 12L15 5.84091Z"
        fill="currentColor"
      />
    </svg>
  );
}
