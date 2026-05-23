"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useOnboardingStore } from "@/store/onboarding";
import { KeywordChip } from "@/components/KeywordChip";
import { MoreChip } from "@/components/MoreChip";

type Language = {
  code: string;
  label: string;
  flag: string | null;
};

const INITIAL_LANGUAGES: Language[] = [
  { code: "ko", label: "한국어", flag: "/images/flags/korean.svg" },
  { code: "en", label: "English", flag: "/images/flags/british.svg" },
  { code: "zh", label: "中文", flag: "/images/flags/chinese.svg" },
  { code: "yue", label: "广东话", flag: "/images/flags/hongkong.svg" },
  { code: "ja", label: "日本語", flag: "/images/flags/japanese.svg" },
  { code: "ar", label: "العربية", flag: "/images/flags/saudi.svg" },
  { code: "fr", label: "Français", flag: "/images/flags/french.svg" },
];

const EXTRA_LANGUAGES: Language[] = [
  { code: "es", label: "Español", flag: null },
  { code: "de", label: "Deutsch", flag: null },
  { code: "pt", label: "Português", flag: null },
  { code: "hi", label: "हिन्दी", flag: null },
  { code: "vi", label: "Tiếng Việt", flag: null },
  { code: "tl", label: "Tagalog", flag: null },
];

function FlagIcon({ flag, label }: { flag: string; label: string }) {
  return (
    <Image
      src={flag}
      alt={label}
      width={20}
      height={20}
      className="rounded-full object-cover shrink-0"
    />
  );
}

export default function LanguagePage() {
  const router = useRouter();
  const { languages, setLanguages } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>(languages);
  const [showMore, setShowMore] = useState(false);

  const visibleLanguages = showMore
    ? [...INITIAL_LANGUAGES, ...EXTRA_LANGUAGES]
    : INITIAL_LANGUAGES;

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function handleNext() {
    if (selected.length === 0) return;
    setLanguages(selected);
    router.push("/onboarding/preferred-style");
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
            <p className="typo-h2 text-surface-950">What languages do you prefer?</p>
            <p className="typo-body1 text-surface-950 max-w-[280px]">We&apos;ll prioritize stylists who speak your language when available.</p>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 w-full">
            {visibleLanguages.map((lang) => (
              <KeywordChip
                key={lang.code}
                label={lang.label}
                selected={selected.includes(lang.code)}
                onClick={() => toggle(lang.code)}
                icon={
                  lang.flag ? (
                    <FlagIcon flag={lang.flag} label={lang.label} />
                  ) : undefined
                }
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
