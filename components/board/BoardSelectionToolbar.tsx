"use client";

import { useState } from "react";
import type { PivotRule } from "@prisma/client";
import { resolvePivotSuggestion, type CombineOperator } from "@/lib/pivot";
import { IconLink } from "@/components/icons";

export function BoardSelectionToolbar({
  selectedValues,
  combinableRules,
  canAddRelationship = false,
  onAddRelationship,
  onClear,
}: {
  selectedValues: string[];
  combinableRules: PivotRule[];
  /** Exactly two nodes are selected — the only case a relationship can be added between them. */
  canAddRelationship?: boolean;
  onAddRelationship?: () => void;
  onClear: () => void;
}) {
  const [operator, setOperator] = useState<CombineOperator>("AND");

  const canDork = selectedValues.length >= 2 && combinableRules.length > 0;
  if (!canDork && !canAddRelationship) return null;

  return (
    <div className="card bg-accent-soft px-4 py-3 absolute bottom-3 left-3 right-3 z-10 flex items-center gap-3 flex-wrap">
      <span className="text-xs font-medium">{selectedValues.length} selected</span>

      {/* Dorking is one option among these, not the default action for a
       *  selection — it only appears once rules for this pairing exist, and
       *  sits beside "add relationship" rather than in place of it. */}
      {canAddRelationship && (
        <button onClick={onAddRelationship} className="btn btn-sm">
          <IconLink /> Add relationship
        </button>
      )}

      {canDork && (
        <>
          <div className="seg">
            {(["AND", "OR"] as const).map((op) => (
              <button key={op} onClick={() => setOperator(op)} className="seg-btn" data-active={operator === op}>
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
        </>
      )}

      <button onClick={onClear} className="btn btn-ghost btn-sm ml-auto">
        Clear
      </button>
    </div>
  );
}
