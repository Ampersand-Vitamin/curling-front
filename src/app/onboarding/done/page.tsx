"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

export default function DonePage() {
  const router = useRouter();
  const store = useOnboardingStore();

  async function handleStart() {
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountMode: store.accountMode,
          name: store.name,
          gender: store.gender,
          hairType: store.hairType,
          hairLength: store.hairLength,
          hairConcerns: store.hairConcerns,
          hairHistory: store.hairHistory,
          languages: store.languages,
          preferredStyles: store.preferredStyles,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("Onboarding save failed:", res.status, body);
      }
    } catch (e) {
      console.error("Onboarding save error:", e);
    }
    router.push("/discover");
  }

  return (
    <div className="flex flex-col h-full bg-white justify-between">
      {/* Top */}
      <div className="flex flex-col flex-1 min-h-0 pt-16 gap-3">
        {/* Back button */}
        <div className="flex items-center w-full shrink-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-3 rounded-full"
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#171717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-3 px-4 shrink-0">
          <h1 className="typo-h2 text-surface-950">You&apos;re all set!</h1>
          <p className="typo-body1 text-surface-950">Let&apos;s find your stylist.</p>
        </div>

        {/* Image — full bleed */}
        <div className="relative shrink-0 w-full" style={{ height: 311 }}>
          <img
            src="/images/done-setting.jpg"
            alt="done"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
            draggable={false}
          />
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{ height: 40, background: "linear-gradient(to top, white, transparent)" }}
          />
        </div>
      </div>

      {/* CTA button */}
      <div className="px-4 pb-8 shrink-0">
        <button
          type="button"
          onClick={handleStart}
          className="w-full bg-secondary-400 rounded-lg px-8 py-4 typo-h6 text-white text-center"
        >
          Start exploring
        </button>
      </div>
    </div>
  );
}
