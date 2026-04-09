// @ts-nocheck
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "blueprint-auth-token";

// Public page routes that don't require authentication
const PUBLIC_PAGE_ROUTES = [
  "/",
  "/services",
  "/calculator",
  "/quote",
  "/portal",
  "/about",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/2fa-setup",
];

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/init",
  "/api/quote-requests",
  "/api/health",
];

/**
 * Check if a given pathname matches any of the public routes.
 * Supports exact match and prefix match for /dashboard (which serves login).
 */
function isPublicPageRoute(pathname: string): boolean {
  // Exact matches
  if (PUBLIC_PAGE_ROUTES.includes(pathname)) return true;

  // Dashboard root is the login page itself — allow it
  if (pathname === "/dashboard") return true;

  // Static assets (images, fonts, _next, favicon, etc.)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js")
  ) {
    return true;
  }

  return false;
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-page, non-API routes (static assets, _next internals)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname.includes(".") // static files with extensions
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // ---- API route protection ----
  if (pathname.startsWith("/api/")) {
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.json(
        { error: "غير مصرح. يرجى تسجيل الدخول" },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // ---- Page route protection ----
  // Protect /dashboard/* sub-routes (but not /dashboard itself which is the login page)
  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard") {
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/dashboard";
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Public page routes are always allowed
  if (isPublicPageRoute(pathname)) {
    return NextResponse.next();
  }

  // For any other route that isn't explicitly public, require auth
  // This acts as a catch-all to protect unknown routes
  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/dashboard";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
