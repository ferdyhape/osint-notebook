import { NextRequest, NextResponse } from "next/server";
import { readSessionToken } from "@/lib/session-token";

const SESSION_COOKIE = "osint_session";

/** Reachable without signing in. Everything else redirects to /login. */
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/share",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify",
  "/api/share",
];

async function hasValidSession(token: string | undefined) {
  if (!token) return false;
  const userId = await readSessionToken(token);
  return userId !== null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = await hasValidSession(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!signedIn && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (signedIn && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
