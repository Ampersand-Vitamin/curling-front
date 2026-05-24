"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

type Mode = "client" | "designer";

export default function AccountModePage() {
  const router = useRouter();
  const setAccountMode = useOnboardingStore((s) => s.setAccountMode);
  const [selected, setSelected] = useState<Mode | null>(null);

  function handleNext() {
    if (!selected) return;
    setAccountMode(selected);
    router.push("/onboarding/name-gender");
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#171717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Heading + cards */}
        <div className="flex flex-col gap-8 px-4 w-full">
          <div className="flex flex-col gap-3">
            <div className="typo-h2 text-surface-950">
              <p>Welcome!</p>
              <p>Let&apos;s get started.</p>
            </div>
            <p className="typo-body1 text-surface-950 max-w-[280px]">
              Are you a client or a stylist?
            </p>
          </div>

          {/* Mode cards */}
          <div className="flex gap-2.5 w-full">
            <ModeCard
              src="/images/account-mode/client.jpg"
              alt="Find Stylists"
              label={["Find", "Stylists"]}
              selected={selected === "client"}
              onClick={() => setSelected("client")}
            />
            <ModeCard
              src="/images/account-mode/stylist.jpg"
              alt="I'm a Stylist"
              label={["I'm a", "Stylist"]}
              selected={selected === "designer"}
              onClick={() => setSelected("designer")}
            />
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

function ModeCard({
  src,
  alt,
  label,
  selected,
  onClick,
}: {
  src: string;
  alt: string;
  label: [string, string];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 h-[226px] rounded-2xl overflow-hidden relative"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-300 ${
          selected ? "grayscale-0 brightness-100" : "grayscale brightness-75"
        }`}
      />
      <div className="absolute inset-x-0 bottom-0 p-2.5 typo-h2 text-white text-left">
        <p>{label[0]}</p>
        <p>{label[1]}</p>
      </div>
    </button>
  );
}
