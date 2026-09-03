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

export function ThemeSwitch() {
  // null until hydration, so the switch can never contradict the rendered page.
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, () => null);
  const isDark = theme === "dark";

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

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggle}
      className="menu-item menu-item-row"
    >
      <span>Dark mode</span>
      <span className="switch" data-on={isDark} aria-hidden="true">
        <span className="switch-knob" />
      </span>
    </button>
  );
}
