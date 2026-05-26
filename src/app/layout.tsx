import type { Metadata } from "next";
import localFont from "next/font/local";
import { Roboto } from "next/font/google";
import ClarityProvider from "@/components/ClarityProvider";
import "./globals.css";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard-variable",
  display: "swap",
  weight: "400 600",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Curling",
  description:
    "한국 거주/방문 외국인을 위한 헤어 스타일 탐색 및 디자이너·살롱 매칭 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pretendard.variable} ${roboto.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="h-full flex justify-center bg-surface-950 font-pretendard overflow-hidden">
        <ClarityProvider />
        {children}
      </body>
    </html>
  );
}
