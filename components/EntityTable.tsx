"use client";

import { useState } from "react";
import Link from "next/link";
import type { PivotRule } from "@prisma/client";
import { resolvePivotSuggestion, isUrlValue, type CombineOperator } from "@/lib/pivot";
import { EntityFormModal } from "@/components/EntityFormModal";
import { DeleteEntityButton } from "@/components/DeleteEntityButton";
import { CopyButton } from "@/components/CopyButton";

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
  readOnly = false,
  linkToDetail = true,
}: {
  caseId: number;
  entities: EntityRow[];
  combinableRules: PivotRule[];
  readOnly?: boolean;
  /** False for the anonymous share view — that page has no authenticated entity-detail route to link to. */
  linkToDetail?: boolean;
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
        <div className="card bg-accent-soft px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium">{selectedValues.length} selected</span>

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

          <button onClick={() => setSelectedIds([])} className="btn btn-ghost btn-sm ml-auto">
            Clear
          </button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-subtle">
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
                  selectedIds.includes(e.id) ? "bg-accent-soft" : "hover:bg-surface-subtle"
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
                  <div className="flex items-center gap-1.5">
                    {linkToDetail ? (
                      <Link
                        href={`/cases/${caseId}/entities/${e.id}`}
                        className="font-data text-[0.8125rem] font-medium hover:text-accent truncate"
                      >
                        {e.value}
                      </Link>
                    ) : (
                      <span className="font-data text-[0.8125rem] font-medium truncate">{e.value}</span>
                    )}
                    {isUrlValue(e.value) && (
                      <a
                        href={e.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-accent shrink-0"
                        title="Open link"
                        aria-label="Open link"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted">{e.source || "—"}</td>
                <td className="px-4 py-2.5 text-muted text-xs whitespace-nowrap">
                  {new Date(e.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <CopyButton value={e.value} className="btn btn-row" />
                    {!readOnly && (
                      <>
                        <EntityFormModal
                          caseId={caseId}
                          initial={{ id: e.id, type: e.type, value: e.value, source: e.source }}
                        />
                        <DeleteEntityButton entityId={e.id} entityValue={e.value} />
                      </>
                    )}
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
