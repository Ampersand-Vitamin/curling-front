import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Design Ref: §5 — Pretendard via next/font/local, weight 400/500/600
const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard-variable",
  display: "swap",
  weight: "400 600",
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
    <html lang="en" className={`${pretendard.variable} h-full antialiased`}>
      <body className="h-full flex justify-center bg-surface-950 font-pretendard overflow-hidden">
        {children}
      </body>
    </html>
  );
}
