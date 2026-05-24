import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 로그인 필수 페이지
  if ((pathname.startsWith("/onboarding") || pathname.startsWith("/my")) && !user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 이미 로그인된 경우 로그인 페이지 → discover로
  if (pathname === "/" && user) {
    return NextResponse.redirect(new URL("/discover", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/onboarding/:path*", "/my/:path*"],
};
