"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ENTITY_TYPES } from "@/lib/pivot";
import { DEFAULT_RELATION_TYPE, relationSubject } from "@/lib/relationship";
import { EntityTypeInput } from "@/components/EntityTypeInput";
import { RelationTypeInput } from "@/components/RelationTypeInput";

export type EntityFormValues = {
  id: number;
  type: string;
  value: string;
  label?: string | null;
  source: string | null;
};

type EntityFormProps = {
  caseId: number;
  /** Omit to create a new entity. */
  initial?: EntityFormValues;
  /** Links the new entity back to the entity it was pivoted from — and gives
   *  the relation-type hint something to name on the "from" side. */
  relatedToEntityId?: number;
  relatedFrom?: { type: string; label?: string | null };
  onDone?: () => void;
};

export function EntityForm({ caseId, initial, relatedToEntityId, relatedFrom, onDone }: EntityFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [type, setType] = useState(initial?.type ?? ENTITY_TYPES[0]);
  const [value, setValue] = useState(initial?.value ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [source, setSource] = useState(initial?.source ?? "");
  const [relationType, setRelationType] = useState(DEFAULT_RELATION_TYPE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        isEdit ? `/api/entities/${initial!.id}` : `/api/cases/${caseId}/entities`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            value,
            label: label.trim() || null,
            source: source || null,
            ...(!isEdit && relatedToEntityId && { relatedToEntityId, relationType }),
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save the entity");
      }
      if (!isEdit) {
        setValue("");
        setLabel("");
        setSource("");
      }
      router.refresh();
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <EntityTypeInput value={type} onChange={setType} />
        </div>
        <div>
          <label className="label">Value</label>
          <input
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="field font-data"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div>
        <label className="label">Label (optional)</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="field"
          placeholder="A friendlier name to show instead of the raw value"
        />
      </div>

      {!isEdit && relatedToEntityId && (
        <div>
          <label className="label">Relationship to the entity it came from</label>
          <RelationTypeInput
            value={relationType}
            onChange={setRelationType}
            fromText={relatedFrom ? relationSubject(relatedFrom) : "This entity"}
            toText={label.trim() || type || "…"}
          />
        </div>
      )}

      <div>
        <label className="label">Source (optional)</label>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="field"
          placeholder="Where you found it"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onDone && (
          <button type="button" onClick={onDone} className="btn btn-ghost">
            Cancel
          </button>
        )}
        <button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-50">
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Add entity"}
        </button>
      </div>
    </form>
  );
}
