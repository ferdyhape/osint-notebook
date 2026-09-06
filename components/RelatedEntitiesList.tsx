"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddRelationshipModal, type EntityOption } from "@/components/AddRelationshipModal";
import { RelationTypeInput } from "@/components/RelationTypeInput";
import { RelationshipRow } from "@/components/RelationshipRow";
import { IconEdit, IconTrash, IconPlus } from "@/components/icons";
import { relationSubject } from "@/lib/relationship";

export type RelatedRow = {
  relationshipId: number;
  relationType: string;
  /** Is `other` the source (entityA) or the found/target entity (entityB)? */
  otherIs: "source" | "target";
  other: EntityOption;
};

/**
 * The "Related entities" section on an entity's own page — editable here
 * (item 1), and always rendered as one canonical sentence, "{source}
 * {relation} {target}", regardless of which side of the relationship the
 * current page happens to be on. The current entity's own value is never
 * repeated (it's the page you're already reading); the other side is always
 * the part that's linked.
 */
export function RelatedEntitiesList({
  caseId,
  current,
  related,
  readOnly,
}: {
  caseId: number;
  current: EntityOption;
  related: RelatedRow[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const currentSubject = relationSubject(current);

  async function save(relationshipId: number) {
    if (!draft.trim()) return;
    setBusyId(relationshipId);
    try {
      const res = await fetch(`/api/relationships/${relationshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relationType: draft.trim() }),
      });
      if (res.ok) setEditingId(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(relationshipId: number) {
    setBusyId(relationshipId);
    try {
      await fetch(`/api/relationships/${relationshipId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">Related entities</h2>
        {!readOnly && (
          <button onClick={() => setAddOpen(true)} className="btn btn-sm">
            <IconPlus /> Add relationship
          </button>
        )}
      </div>

      {related.length === 0 ? (
        <div className="card border-dashed p-8 text-center">
          <p className="text-sm text-muted">Nothing linked to this yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {related.map((r) => {
            const otherSubject = relationSubject(r.other);
            const isEditing = editingId === r.relationshipId;
            return (
              <li key={r.relationshipId} className="card p-3.5 text-sm group">
                {isEditing ? (
                  <div className="space-y-2">
                    <RelationTypeInput
                      value={draft}
                      onChange={setDraft}
                      fromText={r.otherIs === "target" ? currentSubject : otherSubject}
                      toText={r.otherIs === "target" ? otherSubject : currentSubject}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingId(null)} className="btn btn-ghost btn-sm">
                        Cancel
                      </button>
                      <button
                        onClick={() => save(r.relationshipId)}
                        disabled={busyId === r.relationshipId}
                        className="btn btn-primary btn-sm disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 font-data text-sm">
                      <RelationshipRow
                        caseId={caseId}
                        relationType={r.relationType}
                        otherIs={r.otherIs}
                        current={current}
                        other={r.other}
                      />
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingId(r.relationshipId);
                            setDraft(r.relationType);
                          }}
                          className="btn btn-row"
                          aria-label="Edit relationship"
                          title="Edit relationship"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => remove(r.relationshipId)}
                          className="btn btn-row btn-row-danger"
                          aria-label="Delete relationship"
                          title="Delete relationship"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (
        <AddRelationshipModal open={addOpen} onClose={() => setAddOpen(false)} caseId={caseId} from={current} />
      )}
    </div>
  );
}
