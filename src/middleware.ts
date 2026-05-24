import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // 로그인 필수 페이지
  if ((pathname.startsWith("/onboarding") || pathname === "/my") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 이미 로그인된 경우 로그인 페이지 → discover로
  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/discover", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/onboarding/:path*", "/my"],
};
