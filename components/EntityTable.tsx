"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PivotRule } from "@prisma/client";
import { resolvePivotSuggestion, isUrlValue, type CombineOperator } from "@/lib/pivot";
import { EntityFormModal } from "@/components/EntityFormModal";
import { DeleteEntityButton } from "@/components/DeleteEntityButton";
import { CopyButton } from "@/components/CopyButton";
import { CopyableText } from "@/components/CopyableText";
import { AddRelationshipModal, type EntityOption } from "@/components/AddRelationshipModal";
import { IconExternalLink, IconLink } from "@/components/icons";

type EntityRow = {
  id: number;
  type: string;
  value: string;
  label?: string | null;
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
  // Multi-select is an editing action (dorking, linking two entities) — a
  // shared/read-only view has nothing to do with a selection, so the whole
  // mechanism (checkboxes included) doesn't exist there at all.
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [operator, setOperator] = useState<CombineOperator>("AND");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [addRelationship, setAddRelationship] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!actionsOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setActionsOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [actionsOpen]);

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

  const selected = entities.filter((e) => selectedIds.includes(e.id));
  const selectedValues = selected.map((e) => e.value);
  const canLinkPair = !readOnly && selected.length === 2;
  const canDork = selected.length >= 2 && combinableRules.length > 0;
  const showActions = !readOnly && selected.length >= 2 && (canLinkPair || canDork);

  const asOption = (e: EntityRow): EntityOption => ({ id: e.id, type: e.type, value: e.value, label: e.label });

  return (
    <div className="space-y-2">
      {showActions && (
        <div className="relative flex items-center gap-2" ref={menuRef}>
          <button
            onClick={() => setActionsOpen((v) => !v)}
            className="btn btn-sm"
            aria-haspopup="menu"
            aria-expanded={actionsOpen}
          >
            {selected.length} selected — Actions ▾
          </button>
          <button onClick={() => setSelectedIds([])} className="btn btn-ghost btn-sm">
            Clear
          </button>

          {actionsOpen && (
            <div role="menu" className="menu-panel top-full mt-1 left-0 right-auto w-[20rem] p-1">
              {canLinkPair && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setAddRelationship(true);
                    setActionsOpen(false);
                  }}
                  className="menu-item flex items-center gap-2"
                >
                  <IconLink />
                  Add relationship between these two
                </button>
              )}

              {canDork && (
                <div className={canLinkPair ? "mt-1 pt-1 border-t border-border" : ""}>
                  <div className="px-2 py-1.5 flex items-center justify-between gap-2">
                    <span className="eyebrow">Search together</span>
                    <div className="seg">
                      {(["AND", "OR"] as const).map((op) => (
                        <button
                          key={op}
                          onClick={() => setOperator(op)}
                          className="seg-btn"
                          data-active={operator === op}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>
                  {combinableRules.map((rule) => {
                    const { resolvedUrl } = resolvePivotSuggestion(rule, selectedValues, operator);
                    if (!resolvedUrl) return null;
                    return (
                      <a
                        key={rule.id}
                        role="menuitem"
                        href={resolvedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setActionsOpen(false)}
                        className="menu-item"
                        title={rule.description}
                      >
                        {rule.title} ↗
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-subtle">
            <tr className="border-b border-border text-xs text-muted">
              {!readOnly && <th className="w-9 px-3 py-2.5" />}
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
                {!readOnly && (
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(e.id)}
                      onChange={() => toggle(e.id)}
                      aria-label={`Select ${e.value}`}
                    />
                  </td>
                )}
                <td className="px-4 py-2.5 max-w-[9rem]">
                  <span className="badge" title={e.type}>
                    {e.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 max-w-[16rem]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="min-w-0">
                      {e.label && (
                        <p className="text-[0.8125rem] font-medium truncate" title={e.label}>
                          {e.label}
                        </p>
                      )}
                      {linkToDetail ? (
                        <Link
                          href={`/cases/${caseId}/entities/${e.id}`}
                          title={e.value}
                          className={`block font-data hover:text-accent truncate ${
                            e.label ? "text-xs text-muted" : "text-[0.8125rem] font-medium"
                          }`}
                        >
                          {e.value}
                        </Link>
                      ) : (
                        <span
                          title={e.value}
                          className={`block font-data truncate ${
                            e.label ? "text-xs text-muted" : "text-[0.8125rem] font-medium"
                          }`}
                        >
                          {e.value}
                        </span>
                      )}
                    </div>
                    <CopyButton
                      value={e.value}
                      className="btn btn-row shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                    />
                    {isUrlValue(e.value) && (
                      <a
                        href={e.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-accent shrink-0"
                        title="Open link"
                        aria-label="Open link"
                      >
                        <IconExternalLink />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 max-w-[12rem]">
                  <CopyableText value={e.source} className="text-muted text-sm" />
                </td>
                <td className="px-4 py-2.5 text-muted text-xs whitespace-nowrap">
                  {new Date(e.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-3 py-2.5">
                  {!readOnly && (
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <EntityFormModal
                        caseId={caseId}
                        placement="row"
                        initial={{ id: e.id, type: e.type, value: e.value, label: e.label, source: e.source }}
                      />
                      <DeleteEntityButton entityId={e.id} entityValue={e.value} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && !showActions && entities.length >= 2 && (
        <p className="text-xs text-muted">
          Select two entities to add a relationship between them or search for them together.
        </p>
      )}

      {canLinkPair && selected.length === 2 && (
        <AddRelationshipModal
          open={addRelationship}
          onClose={() => setAddRelationship(false)}
          caseId={caseId}
          from={asOption(selected[0])}
          to={asOption(selected[1])}
          onCreated={() => setSelectedIds([])}
        />
      )}
    </div>
  );
}
