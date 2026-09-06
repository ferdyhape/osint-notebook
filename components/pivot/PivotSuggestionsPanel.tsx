"use client";

import { useEffect, useState } from "react";
import { EntityForm } from "@/components/entities/EntityForm";

type Suggestion = {
  id: number;
  entityType: string;
  title: string;
  description: string;
  actionType: string;
  category: string;
  isFree: boolean;
  resolvedUrl: string | null;
  createdById: number | null;
};

export function PivotSuggestionsPanel({
  caseId,
  entityId,
  entityType,
  entityLabel,
  readOnly = false,
  fetchUrl,
}: {
  caseId: number;
  entityId: number;
  /** The entity this panel is for — feeds the "from" side of the relation-type
   *  hint when logging a finding pivoted from here. */
  entityType?: string;
  entityLabel?: string | null;
  readOnly?: boolean;
  /** Overrides the default `/api/entities/[id]/pivot-suggestions` — used by the anonymous share view's token-scoped endpoint. */
  fetchUrl?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [logFormOpenFor, setLogFormOpenFor] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(fetchUrl ?? `/api/entities/${entityId}/pivot-suggestions`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSuggestions(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityId, fetchUrl]);

  if (loading) {
    return <p className="text-sm text-muted">Loading suggestions…</p>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="card border-dashed p-8 text-center">
        <p className="text-sm text-muted">
          {readOnly ? (
            "No suggestions for this type yet."
          ) : (
            <>
              No suggestions for this type yet. Add one on the{" "}
              <a href="/pivot-rules" className="text-accent hover:underline">
                Pivot Rules
              </a>{" "}
              page.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {suggestions.map((s, i) => (
        <li key={s.id} className="enter card p-3.5" style={{ animationDelay: `${i * 30}ms` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="item-title">{s.title}</p>
                <span className="eyebrow">{s.category}</span>
                {s.createdById !== null && <span className="badge badge-accent">your rule</span>}
              </div>
              <p className="text-sm text-muted mt-0.5">{s.description}</p>
            </div>
            {s.resolvedUrl && (
              <a
                href={s.resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm shrink-0"
              >
                Open ↗
              </a>
            )}
          </div>

          {!readOnly &&
            (logFormOpenFor === s.id ? (
              <div className="mt-3 border-t border-border pt-3">
                <EntityForm
                  caseId={caseId}
                  relatedToEntityId={entityId}
                  relatedFrom={entityType ? { type: entityType, label: entityLabel } : undefined}
                  onDone={() => setLogFormOpenFor(null)}
                />
              </div>
            ) : (
              <button
                onClick={() => setLogFormOpenFor(s.id)}
                className="btn btn-ghost btn-sm mt-2 hover:underline"
              >
                + Log a finding from this step
              </button>
            ))}
        </li>
      ))}
    </ul>
  );
}
