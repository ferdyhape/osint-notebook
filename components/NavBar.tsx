"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";

const LINKS = [
  { href: "/", label: "Cases" },
  { href: "/pivot-rules", label: "Pivot Rules" },
];

export function NavBar({ user }: { user: { email: string; name: string | null } | null }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo-mark.png" alt="" width={24} height={24} priority />
          <span className="hidden sm:inline font-display text-base font-bold tracking-tight whitespace-nowrap">
            OSINT Notebook
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1 min-w-0">
          {user && (
            <>
              {LINKS.map((link) => {
                const active =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                      active ? "bg-accent-soft text-accent" : "text-muted hover:text-text"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </>
          )}
          <div className="ml-1 sm:ml-0 shrink-0">{user ? <UserMenu user={user} /> : <ThemeToggleButton />}</div>
        </nav>
      </div>
    </header>
  );
}
