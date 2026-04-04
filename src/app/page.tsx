export default function Home() {
  return (
    <div className="min-h-screen bg-surface-50 p-8">
      {/* Color Tokens */}
      <section className="mb-12">
        <h1 className="text-h1 text-surface-950 mb-6">Curling Design Tokens</h1>

        <h2 className="text-h3 text-surface-700 mb-4">Color Palette</h2>
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Primary */}
          <div className="flex flex-col gap-2">
            <p className="text-caption text-surface-500">Primary</p>
            <div className="flex gap-1">
              <div className="w-12 h-12 rounded-lg bg-primary-50" title="50" />
              <div className="w-12 h-12 rounded-lg bg-primary-200" title="200" />
              <div className="w-12 h-12 rounded-lg bg-primary-300" title="300" />
              <div className="w-12 h-12 rounded-lg bg-primary-400" title="400" />
              <div className="w-12 h-12 rounded-lg bg-primary-600" title="600" />
              <div className="w-12 h-12 rounded-lg bg-primary-700" title="700" />
            </div>
          </div>

          {/* Secondary */}
          <div className="flex flex-col gap-2">
            <p className="text-caption text-surface-500">Secondary</p>
            <div className="flex gap-1">
              <div className="w-12 h-12 rounded-lg bg-secondary-50" title="50" />
              <div className="w-12 h-12 rounded-lg bg-secondary-200" title="200" />
              <div className="w-12 h-12 rounded-lg bg-secondary-300" title="300" />
              <div className="w-12 h-12 rounded-lg bg-secondary-400" title="400" />
              <div className="w-12 h-12 rounded-lg bg-secondary-500" title="500" />
              <div className="w-12 h-12 rounded-lg bg-secondary-600" title="600" />
            </div>
          </div>

          {/* Accent */}
          <div className="flex flex-col gap-2">
            <p className="text-caption text-surface-500">Accent</p>
            <div className="flex gap-1">
              <div className="w-12 h-12 rounded-lg bg-accent-100" title="100" />
              <div className="w-12 h-12 rounded-lg bg-accent-300" title="300" />
              <div className="w-12 h-12 rounded-lg bg-accent-400" title="400" />
              <div className="w-12 h-12 rounded-lg bg-accent-500" title="500" />
              <div className="w-12 h-12 rounded-lg bg-accent-700" title="700" />
              <div className="w-12 h-12 rounded-lg bg-accent-900" title="900" />
            </div>
          </div>

          {/* Success */}
          <div className="flex flex-col gap-2">
            <p className="text-caption text-surface-500">Success</p>
            <div className="flex gap-1">
              <div className="w-12 h-12 rounded-lg bg-success-100" title="100" />
              <div className="w-12 h-12 rounded-lg bg-success-500" title="500" />
            </div>
          </div>
        </div>

        {/* Surface */}
        <h2 className="text-h3 text-surface-700 mb-4">Surface</h2>
        <div className="flex gap-1 mb-8">
          <div className="w-12 h-12 rounded-lg bg-surface-50 border border-surface-200" title="50" />
          <div className="w-12 h-12 rounded-lg bg-surface-100" title="100" />
          <div className="w-12 h-12 rounded-lg bg-surface-200" title="200" />
          <div className="w-12 h-12 rounded-lg bg-surface-300" title="300" />
          <div className="w-12 h-12 rounded-lg bg-surface-400" title="400" />
          <div className="w-12 h-12 rounded-lg bg-surface-500" title="500" />
          <div className="w-12 h-12 rounded-lg bg-surface-600" title="600" />
          <div className="w-12 h-12 rounded-lg bg-surface-700" title="700" />
          <div className="w-12 h-12 rounded-lg bg-surface-800" title="800" />
          <div className="w-12 h-12 rounded-lg bg-surface-900" title="900" />
          <div className="w-12 h-12 rounded-lg bg-surface-950" title="950" />
        </div>
      </section>

      {/* Typography Tokens */}
      <section>
        <h2 className="text-h3 text-surface-700 mb-4">Typography</h2>
        <div className="flex flex-col gap-3 bg-white p-6 rounded-xl">
          <p className="text-h1">H1 — 나를 이해하는 스타일리스트 찾기</p>
          <p className="text-h2">H2 — The quick brown fox jumps</p>
          <p className="text-h3">H3 — 나를 이해하는 스타일리스트 찾기</p>
          <p className="text-h4">H4 — The quick brown fox jumps</p>
          <p className="text-h5">H5 — 나를 이해하는 스타일리스트 찾기</p>
          <p className="text-h6">H6 — The quick brown fox jumps</p>
          <p className="text-body">Body — 나를 이해하는 스타일리스트 찾기</p>
          <p className="text-body2">Body 2 — The quick brown fox jumps</p>
          <p className="text-caption text-surface-500">Caption — 나를 이해하는 스타일리스트 찾기</p>
          <p className="text-button1 text-primary-600">Button 1 — The quick brown fox jumps</p>
        </div>
      </section>
    </div>
  );
}
