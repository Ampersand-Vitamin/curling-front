"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { KeywordChip } from "@/components/KeywordChip";

type Gender = "Female" | "Male" | "Non-binary" | "Prefer not to say";

const GENDER_OPTIONS: Gender[] = ["Female", "Male", "Non-binary", "Prefer not to say"];

export default function NameGenderPage() {
  const router = useRouter();
  const { name, setName, setGender } = useOnboardingStore();
  const [localName, setLocalName] = useState(name);
  const [localGender, setLocalGender] = useState<Gender | null>(null);

  function handleNext() {
    if (!localName.trim()) return;
    setName(localName.trim());
    if (localGender) setGender(localGender);
    router.push("/onboarding/hair-type");
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
            <p className="typo-h2 text-surface-950">Tell us about you.</p>
            <p className="typo-body1 text-surface-950 max-w-[280px]">Just a couple of basics to get started.</p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {/* Name field */}
            <div className="flex flex-col gap-2.5 w-full">
              <p className="typo-h5 text-surface-950">What should we call you?</p>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="Your name or nickname"
                className="w-full h-14 bg-surface-200 rounded-2xl px-4 typo-h6 text-surface-950 placeholder:text-surface-400 focus:outline-none"
              />
            </div>

            {/* Gender field */}
            <div className="flex flex-col gap-2.5 w-full">
              <p className="typo-h5 text-surface-800">How do you identify? (optional)</p>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <KeywordChip
                    key={option}
                    label={option}
                    selected={localGender === option}
                    onClick={() => setLocalGender(localGender === option ? null : option)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom — Next button */}
      <div className="px-4 pb-8 w-full">
        <button
          type="button"
          onClick={handleNext}
          disabled={!localName.trim()}
          className="w-full bg-surface-800 rounded-lg px-8 py-4 typo-h6 text-white text-center transition-opacity disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
