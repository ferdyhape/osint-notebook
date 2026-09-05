"use client";

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
