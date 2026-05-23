"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { KeywordChip } from "@/components/KeywordChip";

const HAIR_LENGTHS = [
  "Short (above shoulders)",
  "Medium (collarbone)",
  "Long (chest to waist)",
  "Extra Long (below waist)",
];

export default function HairLengthPage() {
  const router = useRouter();
  const { hairLength, setHairLength } = useOnboardingStore();
  const [selected, setSelected] = useState<string | null>(hairLength);

  function handleNext() {
    if (!selected) return;
    setHairLength(selected);
    router.push("/onboarding/hair-concern");
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
            <p className="typo-h2 text-surface-950">How long is your hair?</p>
            <p className="typo-body1 text-surface-950 max-w-[280px]">Select the option that best describes your current length.</p>
          </div>

          {/* Chips — stacked vertically, single select */}
          <div className="flex flex-col gap-2 w-full">
            {HAIR_LENGTHS.map((length) => (
              <KeywordChip
                key={length}
                label={length}
                selected={selected === length}
                onClick={() => setSelected(length)}
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
          disabled={!selected}
          className="w-full bg-surface-800 rounded-lg px-8 py-4 typo-h6 text-white text-center transition-opacity disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
