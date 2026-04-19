"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { storageUrl } from "@/lib/storage";

const SPLASH_IMAGES = [
  "asset/onboarding/splash-bg.png",
  "asset/onboarding/splash-bg-2.png",
  "asset/onboarding/splash-bg-3.png",
];

export default function SplashPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"splash" | "login">("splash");
  const bgImage = useMemo(
    () => storageUrl(SPLASH_IMAGES[Math.floor(Math.random() * SPLASH_IMAGES.length)]),
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => setPhase("login"), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleBrowse = () => {
    router.push("/discover");
  };

  return (
    <div className="relative w-full max-w-[400px] h-full overflow-hidden bg-surface-950">
      {/* 배경 이미지 — 랜덤 */}
      <Image
        src={bgImage}
        alt=""
        fill
        priority
        className="object-cover"
      />

      {/* 로고 — splash: 중앙, login: 위로 이동 */}
      <div
        className={`absolute inset-x-0 flex justify-center transition-all duration-700 ease-out ${
          phase === "splash" ? "top-[40%]" : "top-[22%]"
        }`}
      >
        <img
          src={storageUrl("asset/onboarding/curling-logo.svg")}
          alt="Curling"
          className={`w-[148px] h-[90px] transition-opacity duration-700 ${
            phase === "splash" ? "opacity-0 animate-[fadeIn_0.8s_0.3s_forwards]" : "opacity-100"
          }`}
        />
      </div>

      {/* 로그인 버튼 */}
      <div
        className={`absolute inset-x-0 bottom-[100px] px-5 flex flex-col gap-2.5 transition-all duration-700 ease-out ${
          phase === "login"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <button
          type="button"
          className="flex items-center justify-center h-[60px] rounded-lg bg-surface-50 typo-h6 text-surface-950"
        >
          Continue with Google
        </button>
        <button
          type="button"
          className="flex items-center justify-center h-[60px] rounded-lg backdrop-blur-[15px] bg-surface-500/20 typo-h6 text-surface-50"
        >
          Continue with Email
        </button>
        <button
          type="button"
          onClick={handleBrowse}
          className="flex items-center justify-center h-[60px] rounded-lg typo-h6 text-surface-300 underline"
        >
          Browse without Account
        </button>
      </div>
    </div>
  );
}
