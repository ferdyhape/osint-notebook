"use client";

import { useThemeToggle } from "@/lib/theme";

/** A standalone icon toggle for pages with no account menu to tuck it into — guest-facing pages. */
export function ThemeToggleButton() {
  const { isDark, toggle } = useThemeToggle();

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
