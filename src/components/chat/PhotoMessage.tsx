"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

type Props = { urls: string[] };

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        backgroundColor: "white",
        WebkitMaskImage: `url(/icons/chevron-${direction}.svg)`,
        maskImage: `url(/icons/chevron-${direction}.svg)`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

function ImageViewer({
  urls,
  initialIndex,
  onClose,
}: {
  urls: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const canPrev = index > 0;
  const canNext = index < urls.length - 1;

  const subtleBtn: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(8px)",
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="relative"
        style={{ width: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ borderRadius: "16px", overflow: "hidden" }}>
          <img
            src={urls[index]}
            alt=""
            className="w-full h-auto block"
          />
        </div>

        {canPrev && (
          <button
            onClick={() => setIndex((i) => i - 1)}
            style={{ ...subtleBtn, right: "calc(100% + 24px)" }}
          >
            <ChevronIcon direction="left" />
          </button>
        )}
        {canNext && (
          <button
            onClick={() => setIndex((i) => i + 1)}
            style={{ ...subtleBtn, left: "calc(100% + 24px)" }}
          >
            <ChevronIcon direction="right" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export function PhotoMessage({ urls }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const count = urls.length;
  if (count === 0) return null;

  const cell = "relative rounded-lg overflow-hidden cursor-pointer";
  const img = "absolute inset-0 w-full h-full object-cover";

  const open = (i: number) => setViewerIndex(i);
  const close = () => setViewerIndex(null);

  return (
    <>
      {viewerIndex !== null && (
        <ImageViewer urls={urls} initialIndex={viewerIndex} onClose={close} />
      )}

      {count === 1 && (
        <div
          className={cell}
          style={{ width: 246, height: 164 }}
          onClick={() => open(0)}
        >
          <img src={urls[0]} alt="" className={img} />
        </div>
      )}

      {count === 2 && (
        <div className="grid grid-cols-2 gap-1" style={{ width: 246, height: 164 }}>
          {urls.map((url, i) => (
            <div key={i} className={cell} onClick={() => open(i)}>
              <img src={url} alt="" className={img} />
            </div>
          ))}
        </div>
      )}

      {count >= 3 && (
        <div className="grid grid-cols-3 gap-1" style={{ width: 246, height: 164 }}>
          {/* Large left — spans 2 cols × 2 rows */}
          <div
            className={cell}
            style={{ gridColumn: "1 / span 2", gridRow: "1 / span 2" }}
            onClick={() => open(0)}
          >
            <img src={urls[0]} alt="" className={img} />
          </div>
          {/* Top right */}
          <div className={cell} onClick={() => open(1)}>
            <img src={urls[1]} alt="" className={img} />
          </div>
          {/* Bottom right — overflow count overlay */}
          <div className={cell} onClick={() => open(2)}>
            <img src={urls[2]} alt="" className={img} />
            {count > 3 && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backdropFilter: "blur(15px)", backgroundColor: "rgba(247,246,243,0.3)" }}
              >
                <p className="typo-caption text-white whitespace-nowrap">{count - 3} more</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function parseImageMessage(content: string): string[] | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.type === "images" && Array.isArray(parsed.urls)) {
      return parsed.urls as string[];
    }
  } catch {
    if (
      content.startsWith("http") &&
      /\.(jpe?g|png|webp|gif|avif)/i.test(content)
    ) {
      return [content];
    }
  }
  return null;
}
