"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

const HAIR_TYPES = [
  { id: "straight", label: "Straight", image: "/images/hair-type/straight-hair.jpg" },
  { id: "wavy", label: "Wavy", image: "/images/hair-type/wavy-hair.jpg" },
  { id: "curly", label: "Curly", image: "/images/hair-type/curly-hair.jpg" },
  { id: "coily", label: "Coily", image: "/images/hair-type/coily-hair.jpg" },
] as const;

type HairType = (typeof HAIR_TYPES)[number]["id"];

export default function HairTypePage() {
  const router = useRouter();
  const { hairType, setHairType } = useOnboardingStore();
  const [selected, setSelected] = useState<HairType | null>(hairType);

  function handleNext() {
    if (!selected) return;
    setHairType(selected);
    router.push("/onboarding/hair-length");
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
          <h1 className="typo-h2 text-surface-950">What&apos;s your hair type?</h1>

          {/* 2×2 grid */}
          <div className="grid grid-cols-2 gap-2 w-full">
            {HAIR_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelected(type.id)}
                className="relative h-[180px] overflow-hidden rounded-2xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={type.image}
                  alt={type.label}
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    selected === type.id ? "grayscale-0 brightness-100" : "grayscale brightness-75"
                  }`}
                />
                <span
                  className="absolute inset-0 flex items-center justify-center typo-h5 text-white"
                  style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
                >
                  {type.label}
                </span>
              </button>
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
