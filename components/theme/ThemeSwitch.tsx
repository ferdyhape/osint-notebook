"use client";

import { useThemeToggle } from "@/lib/theme";

export function ThemeSwitch() {
  const { isDark, toggle } = useThemeToggle();

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
