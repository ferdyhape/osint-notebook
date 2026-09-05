import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** Three URLs, and that's the honest total: every case, entity and share link is
 *  private, so listing anything else would just be inviting crawlers to URLs
 *  that answer with a redirect to /login. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/login"), lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/register"), lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];
}
