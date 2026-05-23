"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { KeywordChip } from "@/components/KeywordChip";
import { MoreChip } from "@/components/MoreChip";

const INITIAL_CONCERNS = [
  "None right now",
  "Frizz",
  "Damage",
  "Volume",
  "Scalp issues",
  "Thin Hair",
  "Color care",
  "Split ends",
  "Dryness",
  "Heat Damage",
];

const EXTRA_CONCERNS = [
  "Oiliness",
  "Breakage",
  "Dandruff",
  "Porosity",
  "Graying",
  "Curl definition",
  "Other",
];

export default function HairConcernPage() {
  const router = useRouter();
  const { hairConcerns, toggleHairConcern } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>(hairConcerns);
  const [showMore, setShowMore] = useState(false);

  const concerns = showMore ? [...INITIAL_CONCERNS, ...EXTRA_CONCERNS] : INITIAL_CONCERNS;

  function toggle(concern: string) {
    if (concern === "None right now") {
      setSelected(["None right now"]);
      return;
    }
    setSelected((prev) => {
      const withoutNone = prev.filter((c) => c !== "None right now");
      return withoutNone.includes(concern)
        ? withoutNone.filter((c) => c !== concern)
        : [...withoutNone, concern];
    });
  }

  function handleNext() {
    selected.forEach((c) => {
      if (!hairConcerns.includes(c)) toggleHairConcern(c);
    });
    hairConcerns.forEach((c) => {
      if (!selected.includes(c)) toggleHairConcern(c);
    });
    router.push("/onboarding/hair-history");
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
            <p className="typo-h2 text-surface-950">What does your hair struggle with?</p>
            <p className="typo-body1 text-surface-950 max-w-[280px]">Select all that applies to your hair.</p>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 w-full">
            {concerns.map((concern) => (
              <KeywordChip
                key={concern}
                label={concern}
                selected={selected.includes(concern)}
                onClick={() => toggle(concern)}
              />
            ))}
            {!showMore && (
              <MoreChip onClick={() => setShowMore(true)} />
            )}
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
