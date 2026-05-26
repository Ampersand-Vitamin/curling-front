function Sk({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`bg-surface-200 animate-pulse ${className}`} style={style} />;
}

function DesignerCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Avatar + name + favorite button */}
      <div className="flex items-center gap-2 w-full">
        <Sk className="size-10 rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Sk className="w-24 h-4 rounded-full" />
          <Sk className="w-32 h-3 rounded-full" />
        </div>
        <Sk className="size-12 rounded-full shrink-0" />
      </div>

      {/* Keyword chips */}
      <div className="flex gap-1 flex-wrap">
        {[68, 56, 72, 60].map((w, i) => (
          <Sk key={i} className="h-7 rounded-full shrink-0" style={{ width: w }} />
        ))}
      </div>

      {/* Portfolio thumbnails */}
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <Sk key={i} className="rounded-2xl shrink-0" style={{ width: 150, height: 180 }} />
        ))}
      </div>
    </div>
  );
}

export default function FavoriteLoading() {
  return (
    <div className="min-h-full flex flex-col bg-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white pt-16 shrink-0">
        <div className="relative flex items-center justify-center h-6 mx-4">
          <Sk className="absolute left-0 size-6 rounded-full" />
          <Sk className="w-14 h-4 rounded-full" />
        </div>

        {/* SegmentedControl skeleton */}
        <div className="flex gap-1 px-4 py-3">
          <Sk className="flex-1 h-9 rounded-full" />
          <Sk className="flex-1 h-9 rounded-full" />
        </div>
      </div>

      {/* Designer list */}
      <div className="flex flex-col gap-8 p-4">
        {[0, 1, 2].map((i) => (
          <DesignerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
