"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { PreferredStyleCard } from "@/components/PreferredStyleCard";

type CardDef = { id: string; height: number };

const LEFT_COL: CardDef[] = [
  { id: "balayage-wavy",     height: 201 },
  { id: "long-layered",      height: 169 },
  { id: "pixie",             height: 178 },
  { id: "balayage-brown",    height: 178 },
  { id: "highlight-stright", height: 178 },
  { id: "short-Sperm",       height: 178 },
];

const MID_COL: CardDef[] = [
  { id: "ash-brown",         height: 201 },
  { id: "short-bob",         height: 156 },
  { id: "medium-Scurl",      height: 156 },
  { id: "medium-Ccurl",      height: 156 },
  { id: "wine-color-Sperm",  height: 156 },
  { id: "Pink-hushcut",      height: 156 },
  { id: "Bob-purple-sombre", height: 156 },
];

const RIGHT_COL: CardDef[] = [
  { id: "medium-layered",           height: 156 },
  { id: "Curly-haircut-brown",      height: 156 },
  { id: "Sombre-brown-Scurl",       height: 156 },
  { id: "red-coloring",             height: 156 },
  { id: "highlight-hushcut-blonde", height: 156 },
  { id: "hushcut-ashbrown",         height: 156 },
  { id: "curly-hippieperm",         height: 156 },
];

const COLUMNS = [LEFT_COL, MID_COL, RIGHT_COL];

export default function PreferredStylePage() {
  const router = useRouter();
  const { preferredStyles, setPreferredStyles } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>(preferredStyles);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleNext() {
    setPreferredStyles(selected);
    router.push("/onboarding/done");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "white" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 64, width: "100%", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ padding: 12, borderRadius: 9999, background: "none", border: "none", cursor: "pointer" }}
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#171717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="typo-h2 text-surface-950" style={{ paddingLeft: 16, paddingRight: 16 }}>Tell us what you like.</p>
      </div>

      {/* Scrollable masonry grid */}
      <div style={{ position: "relative", flex: 1, minHeight: 0, marginTop: 16 }}>
        <div
          style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden", paddingLeft: 16, paddingRight: 16, paddingBottom: 32 }}
          className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div style={{ display: "flex", gap: 8 }}>
            {COLUMNS.map((col, colIdx) => (
              <div key={colIdx} style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0, paddingBottom: 32 }}>
                {col.map((card) => (
                  <PreferredStyleCard
                    key={card.id}
                    src={`/images/preferred-style/${card.id}.jpg`}
                    alt={card.id}
                    height={card.height}
                    selected={selected.includes(card.id)}
                    onClick={() => toggle(card.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(to top, white, transparent)", pointerEvents: "none" }} />
      </div>

      {/* Next button */}
      <div style={{ padding: "8px 16px 32px", width: "100%", flexShrink: 0, boxSizing: "border-box" }}>
        <button
          type="button"
          onClick={handleNext}
          className="typo-h6"
          style={{ width: "100%", background: "#3b3a3a", borderRadius: 8, padding: "16px 32px", color: "white", textAlign: "center", border: "none", cursor: "pointer", opacity: selected.length === 0 ? 0.3 : 1 }}
        >
          {selected.length === 0 ? "Skip" : "Next"}
        </button>
      </div>
    </div>
  );
}
