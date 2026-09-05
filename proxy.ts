import { NextRequest, NextResponse } from "next/server";
import { readSessionToken } from "@/lib/session-token";

const SESSION_COOKIE = "osint_session";

/** Reachable without signing in. Everything else redirects to /login. */
const PUBLIC_PATHS = [
  // "/" serves the landing page to visitors and the dashboard to members —
  // app/page.tsx decides which. It has to be reachable without a session or
  // there is nothing for a crawler (or a first-time visitor) to see.
  "/",
  "/login",
  "/register",
  "/share",
  // The SEO surface itself. These aren't excluded by the matcher below (it only
  // skips Next internals and image extensions), so without them here a crawler
  // asking for /robots.txt is answered with a redirect to /login — which is how
  // a site ends up with no crawl directives and no sitemap at all.
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
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

  const response = NextResponse.next();
  // A share URL is a secret: whoever holds the token holds the case. The routes
  // also declare `noindex` in their own metadata, but a header covers what a
  // <meta> tag cannot — the export endpoints, and any crawler that fetches
  // without executing or parsing the page.
  if (pathname.startsWith("/share") || pathname.startsWith("/api/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

export const config = {
  // Everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
