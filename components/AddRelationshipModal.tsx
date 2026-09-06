"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { RelationTypeInput } from "@/components/RelationTypeInput";
import { DEFAULT_RELATION_TYPE, relationSubject } from "@/lib/relationship";

export type EntityOption = { id: number; type: string; value: string; label?: string | null };

type CreatedRelationship = { id: number; relationType: string; entityAId: number; entityBId: number };

/**
 * The manual "link these two entities" flow — the counterpart to drawing a
 * connection by dragging on the board, for anywhere dragging isn't an option
 * (the entities table, an entity's own detail page) or just isn't how someone
 * wants to work.
 */
export function AddRelationshipModal({
  open,
  onClose,
  caseId,
  from,
  to,
  entities,
  onCreated,
  refreshOnCreate = true,
}: {
  open: boolean;
  onClose: () => void;
  caseId: number;
  /** The fixed source (entityA) side. */
  from: EntityOption;
  /** Fixed target — when set, there's no picker, just the relation-type field. */
  to?: EntityOption;
  /** Candidates for the "to" picker. Omit to have the modal fetch the case's own entities. */
  entities?: EntityOption[];
  onCreated?: (rel: CreatedRelationship) => void;
  /** The board updates the live graph itself and skips this — a server-component
   *  refresh would otherwise tear down and rebuild the whole canvas just to add
   *  one edge. Every plain page (the entities table, an entity's own page) wants
   *  the default refresh so its server-rendered list picks up the new link. */
  refreshOnCreate?: boolean;
}) {
  const router = useRouter();
  // Only ever populated by the self-fetch below — when the caller already has
  // a list (`entities`) or a fixed `to`, this stays null and is simply unused.
  const [fetchedOptions, setFetchedOptions] = useState<EntityOption[] | null>(null);
  const [toId, setToId] = useState<number | "">(to?.id ?? "");
  const [relationType, setRelationType] = useState(DEFAULT_RELATION_TYPE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsFetch = !to && !entities;

  useEffect(() => {
    if (!open || !needsFetch) return;
    let cancelled = false;
    fetch(`/api/cases/${caseId}/entities`)
      .then((res) => res.json())
      .then((data: EntityOption[]) => {
        if (!cancelled) setFetchedOptions(data);
      })
      .catch(() => {
        if (!cancelled) setFetchedOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, needsFetch, caseId]);

  // Reset on the way out rather than on the way in — the same net effect
  // (a fresh form next time it opens) without setting state synchronously
  // from inside an effect body.
  function handleClose() {
    setToId(to?.id ?? "");
    setRelationType(DEFAULT_RELATION_TYPE);
    setError(null);
    onClose();
  }

  const options = entities ?? fetchedOptions;
  const target = to ?? options?.find((e) => e.id === toId);
  const candidates = (options ?? []).filter((e) => e.id !== from.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, entityAId: from.id, entityBId: target.id, relationType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not create the relationship");
      }
      const created: CreatedRelationship = await res.json();
      onCreated?.(created);
      if (refreshOnCreate) router.refresh();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add relationship"
      description={`From ${relationSubject(from)} — ${from.value}`}
    >
      <form onSubmit={submit} className="space-y-3">
        {!to && (
          <div>
            <label className="label">To entity</label>
            {options === null ? (
              <p className="text-sm text-muted">Loading entities…</p>
            ) : (
              <select
                required
                value={toId}
                onChange={(e) => setToId(Number(e.target.value))}
                className="field"
              >
                <option value="" disabled>
                  Pick an entity…
                </option>
                {candidates.map((e) => (
                  <option key={e.id} value={e.id}>
                    {relationSubject(e)} — {e.value}
                  </option>
                ))}
              </select>
            )}
            {options !== null && candidates.length === 0 && (
              <p className="text-xs text-muted mt-1">No other entities to link to yet.</p>
            )}
          </div>
        )}

        <div>
          <label className="label">Relationship</label>
          <RelationTypeInput
            value={relationType}
            onChange={setRelationType}
            fromText={relationSubject(from)}
            toText={target ? relationSubject(target) : "…"}
            autoFocus={Boolean(to)}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={handleClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !target}
            className="btn btn-primary disabled:opacity-50"
          >
            {submitting ? "Linking…" : "Add relationship"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
