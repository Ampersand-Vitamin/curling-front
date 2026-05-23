type PreferredStyleCardProps = {
  src: string;
  alt: string;
  height: number;
  selected: boolean;
  onClick: () => void;
};

export function PreferredStyleCard({ src, alt, height, selected, onClick }: PreferredStyleCardProps) {
  return (
    <div
      role="button"
      aria-label={alt}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        draggable={false}
      />
      {selected && (
        <>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(255,255,255,0.3)", backdropFilter: "blur(4px)" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white" aria-hidden="true">
              <path d="M6 1l1.236 2.506L10 3.924l-2 1.95.472 2.752L6 7.306 3.528 8.626 4 5.874 2 3.924l2.764-.418L6 1z" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
