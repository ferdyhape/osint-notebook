import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** Only the front door is crawlable. Everything else is either behind a login or,
 *  in the case of /share, reachable only by a secret token — and a token in a URL
 *  that Google has indexed is no longer a secret, so those are disallowed here
 *  *and* served noindex (see each route's metadata and the X-Robots-Tag in proxy.ts). */
/** Rendered per request, not at build time. Both files embed `siteUrl`, and a
 *  prerendered copy would freeze whatever APP_URL the *build machine* had — which
 *  is how a production sitemap ends up advertising http://localhost:3000. */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        disallow: ["/api/", "/cases/", "/profile", "/pivot-rules", "/share/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
