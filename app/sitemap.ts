import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** Three URLs, and that's the honest total: every case, entity and share link is
 *  private, so listing anything else would just be inviting crawlers to URLs
 *  that answer with a redirect to /login. */
/** Rendered per request, not at build time. Both files embed `siteUrl`, and a
 *  prerendered copy would freeze whatever APP_URL the *build machine* had — which
 *  is how a production sitemap ends up advertising http://localhost:3000. */
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/login"), lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/register"), lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];
}
