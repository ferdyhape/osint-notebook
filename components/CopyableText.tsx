"use client";

import { useState } from "react";

/**
 * Truncated text that copies its *full* value on click — the pairing behind
 * items like the entity table's Source column: a long URL can be clipped to
 * fit the cell (the `title` attribute still reveals the whole thing on
 * hover), while a click still hands you every character, not just what's
 * visible. Not a button with a copy icon bolted on — the text itself is the
 * control, which is what makes "click to copy" legible instead of ambiguous.
 */
export function CopyableText({
  value,
  className = "",
  placeholder = "—",
}: {
  value: string | null | undefined;
  className?: string;
  placeholder?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  if (!value) return <span className={className}>{placeholder}</span>;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard access blocked — nothing more we can do about it here.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied" : value}
      aria-label={copied ? "Copied" : `Copy ${value}`}
      className={`max-w-full truncate text-left hover:text-accent transition-colors cursor-pointer ${className}`}
    >
      {copied ? "Copied" : value}
    </button>
  );
}
