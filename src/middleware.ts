import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * NextAuth.js middleware — protects API routes and dashboard pages.
 *
 * Public routes: /login, /api/auth/*, static assets
 * Protected routes: everything else (dashboard, API)
 *
 * @see https://authjs.dev/getting-started/session-management/protecting
 */

/** Routes that don't require authentication */
const PUBLIC_ROUTES = ["/login", "/api/auth"];

/**
 * Check if a path matches any public route prefix.
 *
 * @param pathname - Request pathname
 * @returns true if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export default auth((req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check auth for protected routes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (req as any).auth;
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
