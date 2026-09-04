"use client";

import { useState } from "react";
import type { PivotRule } from "@prisma/client";
import { resolvePivotSuggestion, type CombineOperator } from "@/lib/pivot";

export function BoardSelectionToolbar({
  selectedValues,
  combinableRules,
  onClear,
}: {
  selectedValues: string[];
  combinableRules: PivotRule[];
  onClear: () => void;
}) {
  const [operator, setOperator] = useState<CombineOperator>("AND");

  if (selectedValues.length < 2 || combinableRules.length === 0) return null;

  return (
    <div className="card bg-accent-soft px-4 py-3 absolute bottom-3 left-3 right-3 z-10 flex items-center gap-3 flex-wrap">
      <span className="text-xs font-medium">{selectedValues.length} selected</span>

      <div className="flex rounded-md border border-border overflow-hidden">
        {(["AND", "OR"] as const).map((op) => (
          <button
            key={op}
            onClick={() => setOperator(op)}
            className={`font-data text-xs px-2.5 py-1 transition-colors ${
              operator === op ? "bg-accent text-on-accent" : "bg-surface text-muted hover:text-text"
            }`}
          >
            {op}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {combinableRules.map((rule) => {
          const { resolvedUrl } = resolvePivotSuggestion(rule, selectedValues, operator);
          if (!resolvedUrl) return null;
          return (
            <a
              key={rule.id}
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
              title={rule.description}
            >
              {rule.title} ↗
            </a>
          );
        })}
      </div>

      <button onClick={onClear} className="btn btn-ghost btn-sm ml-auto">
        Clear
      </button>
    </div>
  );
}
