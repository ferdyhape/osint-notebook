"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const MEDIA = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();

/** The theme in effect: an explicit choice if there is one, otherwise the OS setting. */
function readTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia(MEDIA).matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const media = window.matchMedia(MEDIA);
  media.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onChange);
  };
}

export function ThemeToggle() {
  // null on the server and until hydration, so the icon never contradicts the page.
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, () => null);

  function toggle() {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage blocked (private window) — the choice just won't outlive the tab.
    }
    listeners.forEach((notify) => notify());
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button onClick={toggle} className="btn btn-row" aria-label={label} title={label}>
      {theme === "dark" ? "☀" : theme === "light" ? "☾" : ""}
    </button>
  );
}
