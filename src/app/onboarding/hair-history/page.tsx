"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { KeywordChip } from "@/components/KeywordChip";

const TREATMENTS = [
  "Bleach / Lightening",
  "Dark or black coloring",
  "Red coloring",
  "Chemical straightening",
  "Perm / Wave",
  "Keratin treatment",
  "None of the above",
];

export default function HairHistoryPage() {
  const router = useRouter();
  const { hairHistory, setHairHistory } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>(hairHistory);

  function toggle(treatment: string) {
    if (treatment === "None of the above") {
      setSelected(["None of the above"]);
      return;
    }
    setSelected((prev) => {
      const withoutNone = prev.filter((t) => t !== "None of the above");
      return withoutNone.includes(treatment)
        ? withoutNone.filter((t) => t !== treatment)
        : [...withoutNone, treatment];
    });
  }

  function handleNext() {
    if (selected.length === 0) return;
    setHairHistory(selected);
    router.push("/onboarding/language");
  }

  return (
    <div className="flex flex-col h-full justify-between bg-white">
      {/* Top content */}
      <div className="flex flex-col gap-3 pt-16 w-full">
        {/* Back button */}
        <div className="flex items-center w-full">
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

        {/* Content */}
        <div className="flex flex-col gap-8 px-4 w-full">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <p className="typo-h2 text-surface-950">Have you had any of these treatments?</p>
            <p className="typo-body1 text-surface-950 max-w-[280px]">Select all treatments that apply within the last 2 years.</p>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 w-full">
            {TREATMENTS.map((treatment) => (
              <KeywordChip
                key={treatment}
                label={treatment}
                selected={selected.includes(treatment)}
                onClick={() => toggle(treatment)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom — Next button */}
      <div className="px-4 pb-8 w-full">
        <button
          type="button"
          onClick={handleNext}
          disabled={selected.length === 0}
          className="w-full bg-surface-800 rounded-lg px-8 py-4 typo-h6 text-white text-center transition-opacity disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
