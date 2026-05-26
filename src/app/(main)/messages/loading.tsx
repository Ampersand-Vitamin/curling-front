function Skeleton({ className }: { className: string }) {
  return <div className={`bg-surface-200 animate-pulse rounded-lg ${className}`} />;
}

function FavoriteDesignerSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <Skeleton className="size-14 rounded-full" />
      <Skeleton className="w-12 h-3 rounded-full" />
    </div>
  );
}

function RecentChatSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="size-12 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="w-24 h-3.5 rounded-full" />
          <Skeleton className="w-10 h-3 rounded-full" />
        </div>
        <Skeleton className="w-40 h-3 rounded-full" />
      </div>
    </div>
  );
}

export default function MessagesLoading() {
  return (
    <div className="bg-white min-h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white pt-16 pb-[10px] flex items-center justify-center">
        <Skeleton className="w-20 h-4 rounded-full" />
      </div>

      <div className="flex flex-col px-4 pb-8 gap-6">
        {/* Favorite designers */}
        <section className="flex flex-col gap-3">
          <Skeleton className="w-36 h-4 rounded-full" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <FavoriteDesignerSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Recent chats */}
        <section className="flex flex-col gap-1">
          <Skeleton className="w-24 h-4 rounded-full mb-2" />
          <div className="flex flex-col divide-y divide-surface-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <RecentChatSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
