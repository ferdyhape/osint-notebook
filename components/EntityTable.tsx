"use client";

import { useState } from "react";
import Link from "next/link";
import type { PivotRule } from "@prisma/client";
import { resolvePivotSuggestion, type CombineOperator } from "@/lib/pivot";
import { EntityFormModal } from "@/components/EntityFormModal";
import { DeleteEntityButton } from "@/components/DeleteEntityButton";

type EntityRow = {
  id: number;
  type: string;
  value: string;
  source: string | null;
  createdAt: string;
};

export function EntityTable({
  caseId,
  entities,
  combinableRules,
}: {
  caseId: number;
  entities: EntityRow[];
  combinableRules: PivotRule[];
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [operator, setOperator] = useState<CombineOperator>("AND");

  if (entities.length === 0) {
    return (
      <div className="card border-dashed p-8 text-center">
        <p className="text-sm text-muted">No entities yet.</p>
      </div>
    );
  }

  function toggle(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const selectedValues = entities.filter((e) => selectedIds.includes(e.id)).map((e) => e.value);
  const showCombine = selectedValues.length >= 2 && combinableRules.length > 0;

  return (
    <div className="space-y-2">
      {showCombine && (
        <div className="card bg-accent-soft/50 px-3 py-2.5 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium">{selectedValues.length} selected</span>

          <div className="flex rounded-md border border-border overflow-hidden">
            {(["AND", "OR"] as const).map((op) => (
              <button
                key={op}
                onClick={() => setOperator(op)}
                className={`font-data text-xs px-2.5 py-1 transition-colors ${
                  operator === op ? "bg-accent text-white" : "bg-surface text-muted hover:text-text"
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
                  className="btn text-xs py-1 px-2.5"
                  title={rule.description}
                >
                  {rule.title} ↗
                </a>
              );
            })}
          </div>

          <button onClick={() => setSelectedIds([])} className="btn btn-ghost text-xs ml-auto">
            Clear
          </button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="w-9 px-3 py-2.5" />
              <th className="text-left px-4 py-2.5 font-medium">Type</th>
              <th className="text-left px-4 py-2.5 font-medium">Value</th>
              <th className="text-left px-4 py-2.5 font-medium">Source</th>
              <th className="text-left px-4 py-2.5 font-medium">Added</th>
              <th className="w-px px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entities.map((e) => (
              <tr
                key={e.id}
                className={`group ${
                  selectedIds.includes(e.id) ? "bg-accent-soft/40" : "hover:bg-bg/60"
                }`}
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(e.id)}
                    onChange={() => toggle(e.id)}
                    aria-label={`Select ${e.value}`}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <span className="badge">{e.type}</span>
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/cases/${caseId}/entities/${e.id}`}
                    className="font-data text-[0.8125rem] font-medium hover:text-accent"
                  >
                    {e.value}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-muted">{e.source || "—"}</td>
                <td className="px-4 py-2.5 text-muted font-data text-xs whitespace-nowrap">
                  {new Date(e.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <EntityFormModal
                      caseId={caseId}
                      initial={{ id: e.id, type: e.type, value: e.value, source: e.source }}
                    />
                    <DeleteEntityButton entityId={e.id} entityValue={e.value} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!showCombine && entities.length >= 2 && (
        <p className="text-xs text-muted">
          Select two or more entities to search for them together.
        </p>
      )}
    </div>
  );
}
