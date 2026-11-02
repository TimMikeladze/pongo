import { getIronSession } from "iron-session";
import { type NextRequest, NextResponse } from "next/server";
import { getSessionOptions, type SessionData } from "@/lib/auth";
import { isHowItWorksEnabled } from "@/lib/how-it-works";

const ACCESS_CODE = process.env.ACCESS_CODE;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    /^\/shared\/[^/]+\/how-it-works\/?$/.test(pathname) &&
    !isHowItWorksEnabled()
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Skip auth check if ACCESS_CODE is not set
  if (!ACCESS_CODE) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/shared/") ||
    pathname.startsWith("/readme/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/logo.png";

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    getSessionOptions(),
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
