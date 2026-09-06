"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const MEDIA = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();

/** The theme in effect: an explicit choice if there is one, otherwise the OS setting. */
export function readTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia(MEDIA).matches ? "dark" : "light";
}

export function setTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage blocked (private window) — the choice just won't outlive the tab.
  }
  listeners.forEach((notify) => notify());
}

export function subscribeTheme(onChange: () => void) {
  listeners.add(onChange);
  const media = window.matchMedia(MEDIA);
  media.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onChange);
  };
}

/** The state + toggle behind every theme control in the app — `ThemeSwitch`
 *  (the menu-row switch for signed-in users) and `ThemeToggleButton` (the
 *  standalone icon for guests) each render this differently, but neither
 *  should re-derive `isDark` or the toggle itself. `theme` is `null` until
 *  hydration, so a control can render its "undecided" state rather than ever
 *  contradicting the page it just hydrated into. */
export function useThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribeTheme, readTheme, () => null);
  const isDark = theme === "dark";

  function toggle() {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }

  return { theme, isDark, toggle };
}
