function Sk({ className }: { className: string }) {
  return <div className={`bg-surface-200 animate-pulse ${className}`} />;
}

export default function MyLoading() {
  return (
    <div className="bg-white min-h-full flex flex-col">

      {/* Header */}
      <div className="sticky top-0 bg-white z-10 pt-16 pb-[10px] flex items-center justify-center">
        <Sk className="w-6 h-4 rounded-full" />
      </div>

      <div className="flex flex-col gap-2 px-4 pb-6 flex-1">

        {/* Profile section */}
        <div className="flex flex-col items-center gap-6 py-4">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 w-full">
            <Sk className="rounded-full" style={{ width: 100, height: 100 }} />
            <div className="flex flex-col gap-2 items-center">
              <Sk className="w-28 h-5 rounded-full" />
              <Sk className="w-40 h-4 rounded-full" />
            </div>
          </div>

          {/* Keyword chips */}
          <div className="flex flex-wrap gap-1 justify-center w-full">
            {[48, 64, 56, 72, 52, 60, 68].map((w, i) => (
              <Sk key={i} className="h-7 rounded-full" style={{ width: w }} />
            ))}
          </div>

          {/* Edit profile button */}
          <Sk className="w-full h-11 rounded-lg" />
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-2">
              <Sk className="flex-1 h-12 rounded-lg" />
              <Sk className="flex-1 h-12 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Support */}
        <div className="border-t border-surface-200 py-2 flex flex-col gap-2">
          <Sk className="w-12 h-3 rounded-full" />
          <div className="flex flex-col gap-1">
            {[0, 1].map((i) => (
              <Sk key={i} className="w-full h-11 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-surface-200 py-2 flex flex-col gap-2">
          <Sk className="w-14 h-3 rounded-full" />
          <div className="flex flex-col gap-1">
            {[0, 1, 2, 3].map((i) => (
              <Sk key={i} className="w-full h-11 rounded-lg" />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
