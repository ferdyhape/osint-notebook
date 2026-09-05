import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { VerifyBanner } from "@/components/VerifyBanner";
import { getCurrentUser } from "@/lib/auth";
import { siteDescription, siteName, siteTagline, siteTitle, siteUrl } from "@/lib/site";
import "./globals.css";

// One grotesque sans for both headings and body — the standard, unambiguously
// professional choice for a data-dense enterprise tool (same family GitHub,
// Vercel, and Linear build their dashboards on). Variable weight, so every
// step of the type scale is a real optical weight, not a synthetic bold.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  // Resolves every relative canonical/OG URL below against the real public
  // origin. Without it Next emits relative OG URLs, which crawlers and chat
  // unfurlers can't fetch.
  metadataBase: new URL(siteUrl),
  title: {
    // Every page supplies just its own subject; this appends the product name
    // once, so no page has to (and none ends up saying it twice).
    template: `%s · ${siteName}`,
    default: siteTitle,
  },
  description: siteDescription,
  applicationName: siteName,
  // The home page is the only canonical entry point; each public route sets its
  // own below, and the private ones are noindex, so a stray duplicate URL
  // (a ?next= redirect, say) can't compete with it.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName,
    title: siteTitle,
    description: siteTagline,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: siteTitle, description: siteTagline },
  // The default for the whole app. Anything behind a login, and every share
  // link, overrides this to noindex — see each route's own metadata.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

// Applies the saved theme before first paint, so there is no flash of the wrong one.
const themeScript = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
} catch (e) {}
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    // The theme script sets data-theme before hydration, so this element alone
    // is expected to differ from the server HTML.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <NavBar user={user} />
        {user && !user.emailVerifiedAt && <VerifyBanner />}
        <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-4 text-xs text-muted">
            <span>OSINT Notebook</span>
            <span>
              by{" "}
              <a
                href="https://ferdyhape.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent"
              >
                ferdyhape.com
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
