"use client";

type QuickReply = {
  id: string;
  type: string;
  content: Record<string, string>;
  sort_order: number;
};

type Props = {
  replies: QuickReply[];
  onSelect: (text: string) => void;
  onClose: () => void;
};

export function QuickReplyMenu({ replies, onSelect, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-20" onClick={onClose} />

      {/* Menu */}
      <div className="absolute bottom-full left-0 right-0 mb-2 z-30 bg-white rounded-2xl shadow-lg border border-surface-200 overflow-hidden mx-4">
        {replies.map((reply) => {
          const text =
            reply.content["en"] ??
            Object.values(reply.content)[0];
          return (
            <button
              key={reply.id}
              onClick={() => {
                onSelect(text);
                onClose();
              }}
              className="w-full px-4 py-3 text-left typo-body2 text-surface-950 hover:bg-surface-50 border-b border-surface-100 last:border-0"
            >
              {text}
            </button>
          );
        })}
      </div>
    </>
  );
}
