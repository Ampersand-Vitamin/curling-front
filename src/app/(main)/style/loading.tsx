function Sk({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`bg-surface-200 animate-pulse ${className}`} style={style} />;
}

function PortfolioCardSkeleton({ tall }: { tall?: boolean }) {
  return (
    <div className="flex flex-col gap-2 mb-2">
      <Sk
        className="w-full rounded-2xl"
        style={{ aspectRatio: tall ? "3/4.5" : "3/4" }}
      />
    </div>
  );
}

export default function StyleLoading() {
  // 각 컬럼 높이가 엇갈리도록 left/right 높이 교차
  const leftHeights  = [false, true,  false, true,  false];
  const rightHeights = [true,  false, true,  false, true ];

  return (
    <div className="relative flex flex-col h-full bg-surface-50">

      {/* Sticky top */}
      <div className="sticky top-0 z-20 flex flex-col items-center bg-surface-50 pt-4 pb-2.5">

        {/* Search bar row */}
        <div className="flex items-center gap-1 px-3 py-3 w-full">
          <Sk className="size-12 rounded-full shrink-0" />
          <Sk className="flex-1 h-12 rounded-full" />
          <Sk className="size-12 rounded-full shrink-0" />
          <Sk className="size-12 rounded-full shrink-0" />
        </div>

        {/* Keyword chips */}
        <div className="px-4 w-full">
          <div className="flex gap-1 overflow-hidden pb-1">
            {[52, 68, 60, 76, 56, 72, 64].map((w, i) => (
              <Sk key={i} className="h-7 rounded-full shrink-0" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio grid — 2-column interleaved */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-8">
        <div className="flex gap-2">
          {/* Left column */}
          <div className="flex-1 flex flex-col">
            {leftHeights.map((tall, i) => (
              <PortfolioCardSkeleton key={i} tall={tall} />
            ))}
          </div>
          {/* Right column */}
          <div className="flex-1 flex flex-col">
            {rightHeights.map((tall, i) => (
              <PortfolioCardSkeleton key={i} tall={tall} />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
