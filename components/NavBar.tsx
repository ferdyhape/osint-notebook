"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";

const LINKS = [
  { href: "/", label: "Cases" },
  { href: "/pivot-rules", label: "Pivot Rules" },
];

export function NavBar({ user }: { user: { email: string; name: string | null } | null }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-base font-bold tracking-tight">
          OSINT Notebook
        </Link>

        <nav className="flex items-center gap-1">
          {user && (
            <>
              {LINKS.map((link) => {
                const active =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      active ? "bg-accent-soft text-accent" : "text-muted hover:text-text"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </>
          )}
          <ThemeToggle />
          {user && <UserMenu user={user} />}
        </nav>
      </div>
    </header>
  );
}
