"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function SplashPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"splash" | "login">("splash");
  const [showTagline, setShowTagline] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("login"), 100);        // symbol moves up
    const t2 = setTimeout(() => setShowTagline(true), 800);     // tagline fades in (100 + 700ms transition)
    const t3 = setTimeout(() => setShowButtons(true), 1300);    // buttons cascade in (800 + 500ms delay)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="relative w-full max-w-[400px] h-full overflow-hidden bg-surface-950">
      {/* Background */}
      <Image
        src="/images/splash.jpg"
        alt=""
        fill
        className="object-cover opacity-50"
        priority
      />

      {/* Symbol — moves from vertical center to ~14% from top */}
      <div
        className={`absolute inset-x-0 flex justify-center transition-all duration-700 ease-out ${
          phase === "splash" ? "top-1/2 -translate-y-1/2" : "top-[14%] translate-y-0"
        }`}
      >
        <Image
          src="/images/curling-logo.svg"
          alt="Curling"
          width={148}
          height={148}
          priority
        />
      </div>

      {/* Login content */}
      <div className={`absolute inset-x-0 bottom-[60px] flex flex-col items-center gap-24 ${showTagline || showButtons ? "" : "pointer-events-none"}`}>
        {/* Tagline — opacity only, no movement */}
        <p
          className={`typo-h4 text-surface-50 text-center transition-opacity duration-500 ${
            showTagline ? "opacity-100" : "opacity-0"
          }`}
        >
          Find a hair stylist in Korea<br />
          who understands your hair
        </p>

        {/* Buttons — staggered top to bottom, 20px lift */}
        <div className="w-[326px] flex flex-col gap-3">
          <div
            className={`transition-all duration-500 ${showButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ transitionDelay: showButtons ?"0ms" : "0ms" }}
          >
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/onboarding/account-mode" })}
              className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-[#f2f2f2]"
            >
              <Image src="/images/google-logo.svg" alt="Google" width={20} height={20} unoptimized />
              <span className="flex-1 text-center font-[var(--font-roboto)] font-medium text-[14px] leading-5 text-surface-950">
                Continue with Google
              </span>
            </button>
          </div>

          <div
            className={`transition-all duration-500 ${showButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ transitionDelay: showButtons ?"80ms" : "0ms" }}
          >
            <button
              type="button"
              onClick={() => signIn("kakao", { callbackUrl: "/onboarding/account-mode" })}
              className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-[#fee500]"
            >
              <Image src="/images/kakao-logo.png" alt="Kakao" width={20} height={19} />
              <span className="flex-1 text-center font-[var(--font-roboto)] font-medium text-[14px] leading-5 text-[rgba(0,0,0,0.85)]">
                Login with Kakao
              </span>
            </button>
          </div>

          <div
            className={`transition-all duration-500 ${showButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ transitionDelay: showButtons ?"160ms" : "0ms" }}
          >
            <button
              type="button"
              className="w-full flex items-center justify-center h-11 px-6 rounded-xl bg-surface-800"
            >
              <span className="font-[var(--font-roboto)] font-medium text-[14px] leading-5 text-white">
                Continue with Email
              </span>
            </button>
          </div>

          <div
            className={`transition-all duration-500 ${showButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ transitionDelay: showButtons ?"240ms" : "0ms" }}
          >
            <button
              type="button"
              onClick={() => router.push("/discover")}
              className="w-full flex items-center justify-center h-11"
            >
              <span className="font-[var(--font-roboto)] font-medium text-[14px] leading-5 text-white">
                Browse without Account
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
