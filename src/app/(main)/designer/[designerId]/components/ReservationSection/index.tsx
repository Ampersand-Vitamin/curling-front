// Design Ref: §4.12, §6.5, FR-09, DS-4 — designer-detail
//
// Message / Instagram / WhatsApp / Naver 4개 행. links[key] 존재 시 활성, 없으면 disabled.
// Message 행은 강조 CTA (secondary-400 배경).

import type { DesignerLinks } from "@/lib/designers";

type Channel = "message" | "instagram" | "whatsapp" | "naver";

const CHANNEL_META: Record<Channel, { label: string; cta: string }> = {
  message:   { label: "Message",   cta: "Start Conversation" },
  instagram: { label: "Instagram", cta: "Send DM" },
  whatsapp:  { label: "WhatsApp",  cta: "Send Message" },
  naver:     { label: "Naver",     cta: "Make Reservation" },
};

function MessageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}
function WhatsappIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21l1.65-4.5A8.5 8.5 0 1 1 7.5 19.35L3 21z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1.5-.5-2.5-1.5-3-3l1-1-1-2-1.5 1z" fill="currentColor" />
    </svg>
  );
}
function NaverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
      <path d="M9 8v8M9 8l6 8M15 8v8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICON_MAP: Record<Channel, React.ReactNode> = {
  message: <MessageIcon />,
  instagram: <InstagramIcon />,
  whatsapp: <WhatsappIcon />,
  naver: <NaverIcon />,
};

interface Props {
  links: DesignerLinks;
}

export default function ReservationSection({ links }: Props) {
  const channels: Channel[] = ["message", "instagram", "whatsapp", "naver"];

  return (
    <section className="border-b border-surface-100 py-2">
      <h2 className="typo-h6 text-surface-950 px-4 py-3">Reservation</h2>
      {channels.map((ch) => {
        const url = links[ch];
        const enabled = !!url;
        const meta = CHANNEL_META[ch];
        const isPrimary = ch === "message";

        if (isPrimary) {
          // Message 행은 강조 CTA — 가로 카드 스타일
          return (
            <a
              key={ch}
              href={enabled ? url : undefined}
              aria-disabled={!enabled}
              className={`mx-4 mt-2 mb-2 flex items-center gap-3 rounded-xl px-4 py-3.5 ${
                enabled
                  ? "bg-secondary-400 text-surface-white active:opacity-90"
                  : "bg-surface-200 text-surface-400 pointer-events-none"
              }`}
            >
              <span className="shrink-0">{ICON_MAP[ch]}</span>
              <span className="typo-body1 flex-1">{meta.label}</span>
              <span className="typo-button">{meta.cta}</span>
            </a>
          );
        }

        return (
          <a
            key={ch}
            href={enabled ? url : undefined}
            target={enabled ? "_blank" : undefined}
            rel={enabled ? "noopener noreferrer" : undefined}
            aria-disabled={!enabled}
            className={`flex items-center gap-3 px-4 py-3 ${
              enabled ? "active:bg-surface-100" : "pointer-events-none"
            }`}
          >
            <span className={`shrink-0 ${enabled ? "text-surface-950" : "text-surface-300"}`}>
              {ICON_MAP[ch]}
            </span>
            <span
              className={`typo-body1 flex-1 ${enabled ? "text-surface-950" : "text-surface-300"}`}
            >
              {meta.label}
            </span>
            <span
              className={`typo-button flex items-center gap-1 ${
                enabled ? "text-secondary-500" : "text-surface-300"
              }`}
            >
              {meta.cta}
              <ChevronRight />
            </span>
          </a>
        );
      })}
    </section>
  );
}
