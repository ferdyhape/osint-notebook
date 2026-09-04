"use client";

import { useSyncExternalStore } from "react";
import { readTheme, setTheme, subscribeTheme, type Theme } from "@/lib/theme";

/** A standalone icon toggle for pages with no account menu to tuck it into — guest-facing pages. */
export function ThemeToggleButton() {
  const theme = useSyncExternalStore<Theme | null>(subscribeTheme, readTheme, () => null);
  const isDark = theme === "dark";

  function toggle() {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost btn-sm px-2"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
}
