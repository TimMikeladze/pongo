import { getIronSession } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";
import type { SessionData } from "@/lib/auth";

const ACCESS_CODE = process.env.ACCESS_CODE;
const EXPIRY_DAYS = Number(process.env.EXPIRY_DAYS) || 7;

function getSessionOptions() {
  return {
    password:
      ACCESS_CODE?.padEnd(32, ACCESS_CODE) ||
      "this-password-is-not-used-when-auth-disabled",
    cookieName: "pongo-auth",
    ttl: EXPIRY_DAYS * 24 * 60 * 60,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check if ACCESS_CODE is not set
  if (!ACCESS_CODE) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const isPublicRoute =
    pathname.startsWith("/public/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico";

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    getSessionOptions()
  );

  if (!session.isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
