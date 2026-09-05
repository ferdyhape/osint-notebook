/** Everything the SEO layer needs to know about this deployment, in one place so a
 *  title, a canonical URL and an OG card can never drift apart. */

/** Absolute origin, no trailing slash. Canonical URLs, OG images and the sitemap
 *  are all resolved against this, so it has to be the real public origin —
 *  a wrong value here silently points Google at the wrong host. */
export const siteUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

export const siteName = "OSINT Notebook";

/** The home page's <title>. Written for a search result, not for a tab: it leads
 *  with the name, then says what the thing actually is, and stays inside the
 *  ~60 characters Google renders before truncating. */
export const siteTitle = "OSINT Notebook — Case Notes and Pivots for OSINT Work";

/** Meta description. Google mostly rewrites these, but a specific one still wins
 *  the click when it is used — so it names the concrete nouns of the product
 *  (entities, relationships, next steps) instead of praising it. */
export const siteDescription =
  "Keep an OSINT investigation in one case file: record every entity you find, map how you found it on a visual board, and get suggested next steps for each lead.";

/** Shorter, for the OG/Twitter card, where long text is clipped mid-sentence. */
export const siteTagline = "Case notes, a relationship board, and suggested next steps for OSINT investigations.";

export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The generated 1200x630 card (app/opengraph-image.tsx). Next injects this
 *  automatically for a route that doesn't declare `openGraph` itself — but the
 *  moment a page sets its own `openGraph` object, the file-based image is not
 *  merged in, and the preview loses its picture. Any page setting openGraph
 *  spreads this in. */
export const ogImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${siteName} — case notes and pivots for OSINT work`,
};
