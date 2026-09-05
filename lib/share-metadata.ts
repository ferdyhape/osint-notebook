import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { resolveShareToken } from "@/lib/share-link";
import { ogImage, siteName } from "@/lib/site";

/** Metadata for a public share link. Two things have to be true at once here:
 *
 *  1. The preview must be worth pasting — the recipient should see which case
 *     they're being handed before they open it. So the title carries the case
 *     name and the description its size and owner.
 *  2. The URL must never be indexed. A share token is a capability: whoever has
 *     it has the case, so a token sitting in Google's index is a public leak of
 *     someone's investigation. Hence noindex/nofollow/noarchive here, the
 *     `/share` disallow in robots.ts, and the X-Robots-Tag header in proxy.ts —
 *     three layers, because a crawler only has to ignore one of them.
 *
 *  `noindex` and a rich OG card don't conflict: chat unfurlers read the OG tags
 *  and ignore robots directives, which is exactly the split we want. */
export async function shareMetadata(token: string, view: "board" | "detail"): Promise<Metadata> {
  const robots = { index: false, follow: false, nocache: true, noarchive: true };
  const caseId = await resolveShareToken(token);
  if (!caseId) {
    return { title: "Shared case", robots };
  }

  const found = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      name: true,
      owner: { select: { name: true, email: true } },
      _count: { select: { entities: true, relationships: true } },
    },
  });
  if (!found) return { title: "Shared case", robots };

  const { entities, relationships } = found._count;
  const label = view === "board" ? "Shared board" : "Shared case";
  const title = `${found.name} · ${label}`;
  const description = `${entities} ${entities === 1 ? "entity" : "entities"} and ${relationships} ${
    relationships === 1 ? "relationship" : "relationships"
  }, shared read-only by ${found.owner.name || found.owner.email}.`;

  return {
    title,
    description,
    robots,
    // A share URL is not a page that should accumulate ranking signals, and the
    // token makes every one of them unique anyway — so no canonical is declared.
    alternates: { canonical: null },
    openGraph: { title: `${title} · ${siteName}`, description, type: "website", images: [ogImage] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage.url] },
  };
}
