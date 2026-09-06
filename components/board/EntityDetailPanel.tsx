"use client";

import { useState } from "react";
import Link from "next/link";
import { PivotSuggestionsPanel } from "@/components/PivotSuggestionsPanel";
import { CopyButton } from "@/components/CopyButton";
import { AddRelationshipModal, type EntityOption } from "@/components/AddRelationshipModal";
import { RelationTypeInput } from "@/components/RelationTypeInput";
import { RelationshipRow } from "@/components/RelationshipRow";
import { EntityTypeInput } from "@/components/EntityTypeInput";
import { IconEdit, IconTrash, IconPlus, IconClose } from "@/components/icons";
import { isUrlValue } from "@/lib/pivot";
import { relationSubject } from "@/lib/relationship";
import type { BoardNotePreview, EntityNodeData } from "@/lib/board";

export type RelatedRow = {
  relationshipId: string;
  relationType: string;
  /** Is `other` the source (entityA) or the found/target entity (entityB) of this relationship? */
  otherIs: "source" | "target";
  other: EntityOption;
};

type Props = {
  caseId: number;
  entityId: number;
  data: EntityNodeData;
  /** Every note attached to this entity, newest first — read-only here either way. */
  notes: BoardNotePreview[];
  readOnly: boolean;
  detailHref?: string;
  /** False on the anonymous share view — pivot suggestions are an investigation action and
   *  require a signed-in session, so a guest gets entity info only, no "next steps" pane. */
  showSuggestions?: boolean;
  onClose: () => void;

  /** Every relationship this entity is part of, already resolved against the live
   *  board graph — see InvestigationBoard.relatedRowsFor. Editors only. */
  related?: RelatedRow[];
  /** Every other entity on the board, for the "add relationship" picker. */
  allEntities?: EntityOption[];
  onEntitySaved?: (patch: Partial<EntityNodeData>) => void;
  onNoteAdded?: (note: BoardNotePreview) => void;
  onRelationshipRenamed?: (relationshipId: string, relationType: string) => void;
  onRelationshipDeleted?: (relationshipId: string) => void;
  onRelationshipCreated?: (rel: { id: number; relationType: string; entityAId: number; entityBId: number }) => void;
  onRequestDeleteEntity?: () => void;
};

export function EntityDetailPanel({
  caseId,
  entityId,
  data,
  notes,
  readOnly,
  detailHref,
  showSuggestions = true,
  onClose,
  related = [],
  allEntities = [],
  onEntitySaved,
  onNoteAdded,
  onRelationshipRenamed,
  onRelationshipDeleted,
  onRelationshipCreated,
  onRequestDeleteEntity,
}: Props) {
  const canEdit = !readOnly;

  // --- Entity field editing ------------------------------------------------
  // The parent mounts one of these per selected node with `key={entityId}`
  // (see InvestigationBoard) specifically so switching entities remounts this
  // component and gives it fresh state automatically — a half-typed edit on
  // one card never bleeds into the next one you click, with no effect needed.
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(data.type);
  const [value, setValue] = useState(data.value);
  const [label, setLabel] = useState(data.label ?? "");
  const [source, setSource] = useState(data.source ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveEntity() {
    setSaving(true);
    setError(null);
    try {
      const patch = { type, value, label: label.trim() || null, source: source.trim() || null };
      const res = await fetch(`/api/entities/${entityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Could not save the entity");
      onEntitySaved?.(patch);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // --- Notes ----------------------------------------------------------------
  const [addingNote, setAddingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  async function submitNote() {
    if (!noteDraft.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteDraft.trim(), entityId }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      onNoteAdded?.({ id: created.id, content: created.content, createdAt: created.createdAt });
      setNoteDraft("");
      setAddingNote(false);
    } catch {
      // The textarea keeps its draft on failure so nothing typed is lost.
    } finally {
      setSavingNote(false);
    }
  }

  // --- Related entities -----------------------------------------------------
  const [editingRelId, setEditingRelId] = useState<string | null>(null);
  const [relDraft, setRelDraft] = useState("");
  const [addRelOpen, setAddRelOpen] = useState(false);

  // Persisting (the PATCH/DELETE fetch) is the board's job, same as every other
  // edge edit (reverse direction, change connector) — it already owns the fetch
  // + live-edge-mutation pairing, so relationship edits made from here go
  // through the same single path rather than a second, competing one.
  function saveRelation(relationshipId: string) {
    const relationType = relDraft.trim();
    if (!relationType) return;
    onRelationshipRenamed?.(relationshipId, relationType);
    setEditingRelId(null);
  }

  function deleteRelation(relationshipId: string) {
    onRelationshipDeleted?.(relationshipId);
  }

  const currentAsOption: EntityOption = { id: entityId, type: data.type, value: data.value, label: data.label };

  return (
    <aside className="no-scrollbar card absolute top-3 right-3 bottom-3 w-[23rem] max-w-[calc(100vw-1.5rem)] overflow-y-auto p-4 space-y-4 z-10">
      {/* --- Header / entity fields --- */}
      {editing ? (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <EntityTypeInput value={type} onChange={setType} />
            <input value={value} onChange={(e) => setValue(e.target.value)} className="field font-data" placeholder="Value" />
          </div>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="field" placeholder="Label (optional)" />
          <input value={source} onChange={(e) => setSource(e.target.value)} className="field" placeholder="Source (optional)" />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button onClick={saveEntity} disabled={saving} className="btn btn-primary btn-sm disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="badge" title={data.type}>
              {data.type}
            </span>
            {data.label && (
              <p className="text-sm font-semibold mt-1.5 break-words" title={data.label}>
                {data.label}
              </p>
            )}
            <p className={data.label ? "text-xs text-muted mt-0.5 break-all" : "text-sm font-medium mt-1.5 break-all"}>
              {isUrlValue(data.value) ? (
                <a
                  href={data.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-data hover:text-accent hover:underline"
                >
                  {data.value}
                </a>
              ) : (
                <span className="font-data">{data.value}</span>
              )}
            </p>
            {data.source && <p className="text-xs text-muted mt-0.5 break-words">Source: {data.source}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canEdit && (
              <button onClick={() => setEditing(true)} className="btn btn-row" aria-label="Edit entity" title="Edit entity">
                <IconEdit />
              </button>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">
              <IconClose />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <CopyButton value={data.value} className="btn btn-sm" label="Copy value" />
        {detailHref && (
          <Link href={detailHref} className="btn btn-sm flex-1 justify-center">
            View details →
          </Link>
        )}
        {canEdit && onRequestDeleteEntity && (
          <button onClick={onRequestDeleteEntity} className="btn btn-sm text-danger" title="Delete entity" aria-label="Delete entity">
            <IconTrash />
          </button>
        )}
      </div>

      {/* --- Related entities --- */}
      {(related.length > 0 || canEdit) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="item-title">Related entities{related.length > 0 ? ` (${related.length})` : ""}</h3>
            {canEdit && (
              <button
                onClick={() => setAddRelOpen(true)}
                className="btn btn-row"
                title="Add relationship"
                aria-label="Add relationship"
              >
                <IconPlus />
              </button>
            )}
          </div>

          {related.length === 0 ? (
            <p className="text-xs text-muted">Nothing linked to this yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {related.map((r) => {
                const isEditingRel = editingRelId === r.relationshipId;
                // Always reads "{source} {relation} {target}" — the current
                // entity's own value is never repeated (it's already this
                // panel), the other side is always the linked, clickable part.
                const currentSubject = relationSubject({ type: data.type, label: data.label });
                const otherSubject = relationSubject(r.other);
                return (
                  <li key={r.relationshipId} className="rounded-[8px] bg-surface-subtle px-3 py-2 group">
                    {isEditingRel ? (
                      <div className="space-y-1.5">
                        <RelationTypeInput
                          value={relDraft}
                          onChange={setRelDraft}
                          fromText={r.otherIs === "target" ? currentSubject : otherSubject}
                          toText={r.otherIs === "target" ? otherSubject : currentSubject}
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setEditingRelId(null)} className="btn btn-ghost btn-sm">
                            Cancel
                          </button>
                          <button onClick={() => saveRelation(r.relationshipId)} className="btn btn-primary btn-sm">
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-data text-xs min-w-0">
                          <RelationshipRow
                            caseId={caseId}
                            relationType={r.relationType}
                            otherIs={r.otherIs}
                            current={currentAsOption}
                            other={r.other}
                          />
                        </p>
                        {canEdit && (
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingRelId(r.relationshipId);
                                setRelDraft(r.relationType);
                              }}
                              className="btn btn-row"
                              aria-label="Edit relationship"
                              title="Edit relationship"
                            >
                              <IconEdit />
                            </button>
                            <button
                              onClick={() => deleteRelation(r.relationshipId)}
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
        </div>
      )}

      {/* --- Notes --- */}
      {(notes.length > 0 || canEdit) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="item-title">
              {notes.length > 0 ? `${notes.length} ${notes.length === 1 ? "note" : "notes"}` : "Notes"}
            </h3>
            {canEdit && !addingNote && (
              <button onClick={() => setAddingNote(true)} className="btn btn-row" title="Add note" aria-label="Add note">
                <IconPlus />
              </button>
            )}
          </div>

          {addingNote && (
            <div className="space-y-1.5">
              <textarea
                autoFocus
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
                placeholder="What did you find?"
                className="field"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => {
                    setAddingNote(false);
                    setNoteDraft("");
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button onClick={submitNote} disabled={savingNote} className="btn btn-primary btn-sm disabled:opacity-50">
                  {savingNote ? "Saving…" : "Add note"}
                </button>
              </div>
            </div>
          )}

          {notes.length > 0 && (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li key={note.id} className="rounded-[8px] bg-surface-subtle px-3 py-2">
                  <p className="text-xs whitespace-pre-wrap break-words">{note.content}</p>
                  <p className="text-[0.6875rem] text-muted mt-1.5">
                    {new Date(note.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showSuggestions ? (
        <div className="space-y-2">
          <h3 className="item-title">Suggested next steps</h3>
          <PivotSuggestionsPanel
            caseId={caseId}
            entityId={entityId}
            entityType={data.type}
            entityLabel={data.label}
            readOnly={readOnly}
          />
        </div>
      ) : (
        <p className="text-xs text-muted border-t border-border pt-3">
          Sign in to see investigation suggestions for this entity.
        </p>
      )}

      {canEdit && (
        <AddRelationshipModal
          open={addRelOpen}
          onClose={() => setAddRelOpen(false)}
          caseId={caseId}
          from={currentAsOption}
          entities={allEntities}
          refreshOnCreate={false}
          onCreated={onRelationshipCreated}
        />
      )}
    </aside>
  );
}
