"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeSwitch } from "@/components/ThemeSwitch";

function initials(name: string | null, email: string) {
  const source = name?.trim() || email.split("@")[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export function UserMenu({ user }: { user: { email: string; name: string | null } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        title={user.email}
      >
        {initials(user.name, user.email)}
      </button>

      {open && (
        <div role="menu" className="menu-panel">
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-sm font-medium truncate">{user.name || "Signed in"}</p>
            <p className="font-data text-xs text-muted truncate">{user.email}</p>
          </div>
          <div className="p-1">
            <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className="menu-item">
              Account settings
            </Link>
            <ThemeSwitch />
            <button role="menuitem" onClick={signOut} className="menu-item">
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
