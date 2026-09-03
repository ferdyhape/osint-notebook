import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "OSINT Notebook",
  description: "Case notebook & pivot suggestions for OSINT investigations",
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
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <NavBar user={user} />
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
