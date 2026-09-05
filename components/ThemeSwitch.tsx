"use client";

import { useSyncExternalStore } from "react";
import { readTheme, setTheme, subscribeTheme, type Theme } from "@/lib/theme";

export function ThemeSwitch() {
  // null until hydration, so the switch can never contradict the rendered page.
  const theme = useSyncExternalStore<Theme | null>(subscribeTheme, readTheme, () => null);
  const isDark = theme === "dark";

  function toggle() {
    setTheme(readTheme() === "dark" ? "light" : "dark");
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
