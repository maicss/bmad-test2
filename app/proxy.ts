import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/family/login",
  "/admin/login",
  "/auth/login",
  "/api/auth/parent-login",
  "/api/auth/admin-login",
  "/api/auth/child-login",
  "/api/auth/session",
  "/api/auth/session-check",
  "/api/auth/otp/send",
  "/api/auth/logout",
  "/api/auth/[...all]",
];

const STATIC_ROUTES = [
  "/_next",
  "/static",
  "/favicon.ico",
  "/manifest.json",
  "/icons",
  "/images",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    STATIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("better-auth.session_token");
  const sessionToken = sessionCookie?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/family/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-session-token", sessionToken);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next|static|api/auth|favicon.ico|manifest.json|sw.js|workbox-).*)",
  ],
};
