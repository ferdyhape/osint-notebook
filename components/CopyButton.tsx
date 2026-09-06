"use client";

import { useState } from "react";
import { IconCopy, IconCheck } from "@/components/icons";

export function CopyButton({
  value,
  className = "btn btn-sm",
  label = "Copy value",
}: {
  value: string;
  /** Match the size of whatever it's placed next to — "btn btn-sm" for a header, "btn btn-row" inside a table row. */
  className?: string;
  /** aria-label / title — override when the button sits somewhere the default wording wouldn't make sense. */
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access blocked — nothing more we can do about it here.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={className}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
    >
      {copied ? <IconCheck className="text-accent" /> : <IconCopy />}
    </button>
  );
}
