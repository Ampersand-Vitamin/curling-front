// Design Ref: §4.11, §6.4, FR-08 — designer-detail
// Plan SC-08: highlight_message 가 null/빈 값이면 DOM 에 렌더되지 않음

interface Props {
  message: string | null;
  designerName: string;
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5 text-surface-500">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HighlightBubble({ message, designerName }: Props) {
  const trimmed = message?.trim();
  if (!trimmed) return null;

  return (
    <section className="mx-4 my-3">
      <div className="relative flex gap-2 px-3 py-2.5 bg-surface-100 rounded-xl">
        {/* Tail */}
        <div className="absolute -top-1 left-6 size-2 rotate-45 bg-surface-100" />
        <ChatIcon />
        <p className="typo-body2 text-surface-800 flex-1">
          <span className="text-surface-950">{designerName}</span>: {trimmed}
        </p>
      </div>
    </section>
  );
}
