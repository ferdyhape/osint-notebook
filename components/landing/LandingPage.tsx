import Link from "next/link";
import { TrailDiagram } from "@/components/landing/TrailDiagram";
import { siteName, siteUrl } from "@/lib/site";

/** Four steps in the order an investigation actually runs — the numbering is
 *  load-bearing here, not decoration: you can't pivot from a lead you haven't
 *  recorded, and the same domain from the hero threads through all four. */
const STEPS = [
  {
    title: "Open a case",
    body: "Start from whatever you have — a domain, a handle, an email address — and give the question a home instead of a scratch file.",
  },
  {
    title: "Record every lead",
    body: "Each entity gets its own record: the value, where you found it, and the notes explaining why it matters.",
  },
  {
    title: "Take the next step",
    body: "For any indicator, the notebook proposes concrete follow-ups — the searches and lookups that fit that type of lead — and logs what you found back onto the case.",
  },
  {
    title: "Show the trail",
    body: "Link entities on the board with the relationship you actually observed, then share a read-only link. Your reasoning survives after you've forgotten it.",
  },
];

export function LandingPage() {
  return (
    <div className="space-y-14">
      {/* Structured data: tells Google this URL is a piece of software, not an
          article, which is what earns the richer application result. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: siteName,
            url: siteUrl,
            applicationCategory: "SecurityApplication",
            operatingSystem: "Web",
            description:
              "A case notebook for OSINT investigations: record entities, map how they connect on a visual board, and get suggested next steps for each lead.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        }}
      />

      {/* Two columns from `lg` up: the copy is only ever ~30rem wide, so stacking
       *  the diagram under it left the right half of the page empty and pushed
       *  everything else below the fold. */}
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        <div>
          <p className="eyebrow">OSINT case notebook</p>
          <h1 className="page-title mt-2 text-balance">Every lead you found, and how you got there.</h1>
          <p className="text-base text-muted mt-3.5 leading-relaxed">
            An OSINT trail is only as good as the reasoning behind it. Keep the entities, the sources
            and the links between them in one case file — and get told where to look next.
          </p>
          <div className="flex items-center gap-2.5 mt-6">
            <Link href="/register" className="btn btn-primary">
              Create an account
            </Link>
            <Link href="/login" className="btn">
              Sign in
            </Link>
          </div>
        </div>

        <div>
          <div className="card board-grid-bg p-4 sm:p-6">
            <TrailDiagram />
          </div>
          <p className="text-xs text-muted mt-2.5">
            A case on the board: the entities you have recorded, and the relationship you observed
            between each pair — labelled, directional, and yours to rearrange.
          </p>
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="section-title">
          How it works
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card p-4">
              <span className="font-data text-xs text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="item-title mt-1.5">{step.title}</h3>
              <p className="text-sm text-muted mt-1 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="section-title">Start a case</h2>
          <p className="text-sm text-muted mt-1.5">
            Free, self-hosted, and no third-party API keys to arrange.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/register" className="btn btn-primary">
            Create an account
          </Link>
          <Link href="/login" className="btn btn-ghost">
            I already have one
          </Link>
        </div>
      </section>
    </div>
  );
}
