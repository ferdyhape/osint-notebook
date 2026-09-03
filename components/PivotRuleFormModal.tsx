"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ANY_ENTITY_TYPE } from "@/lib/pivot";
import { Modal } from "@/components/Modal";
import { EntityTypeInput } from "@/components/EntityTypeInput";

export type PivotRuleValues = {
  id: number;
  entityType: string;
  title: string;
  description: string;
  actionType: string;
  urlTemplate: string | null;
  category: string;
  combinable: boolean;
};

export function PivotRuleFormModal({ initial }: { initial?: PivotRuleValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] = useState(initial?.entityType ?? ANY_ENTITY_TYPE);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [actionType, setActionType] = useState<"link" | "manual_step">(
    (initial?.actionType as "link" | "manual_step") ?? "link"
  );
  const [urlTemplate, setUrlTemplate] = useState(initial?.urlTemplate ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [combinable, setCombinable] = useState(initial?.combinable ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openForm() {
    setEntityType(initial?.entityType ?? ANY_ENTITY_TYPE);
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setActionType((initial?.actionType as "link" | "manual_step") ?? "link");
    setUrlTemplate(initial?.urlTemplate ?? "");
    setCategory(initial?.category ?? "");
    setCombinable(initial?.combinable ?? false);
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(isEdit ? `/api/pivot-rules/${initial!.id}` : "/api/pivot-rules", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          title,
          description,
          actionType,
          urlTemplate: actionType === "link" ? urlTemplate : null,
          category,
          combinable: actionType === "link" ? combinable : false,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save the rule");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button onClick={openForm} className={isEdit ? "btn btn-row" : "btn btn-primary"}>
        {isEdit ? "Edit" : "New rule"}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? "Edit rule" : "New rule"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Entity type</label>
              <EntityTypeInput value={entityType} onChange={setEntityType} includeAny />
            </div>
            <div>
              <label className="label">Category</label>
              <input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="dorking"
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="label">Title</label>
            <input
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="field"
            />
          </div>

          <div>
            <label className="label">Action</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as "link" | "manual_step")}
              className="field"
            >
              <option value="link">Open a link</option>
              <option value="manual_step">Manual step</option>
            </select>
          </div>

          {actionType === "link" && (
            <>
              <div>
                <label className="label">
                  URL template — <code className="font-data">{"{value}"}</code> is replaced by the
                  entity value
                </label>
                <input
                  required
                  value={urlTemplate}
                  onChange={(e) => setUrlTemplate(e.target.value)}
                  placeholder="https://example.com/search?q={value}"
                  className="field font-data"
                />
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={combinable}
                  onChange={(e) => setCombinable(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Works with multiple entities
                  <span className="block text-xs text-muted">
                    Appears when several entities are selected, joined with AND/OR. Quotes are added
                    for you.
                  </span>
                </span>
              </label>
            </>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary disabled:opacity-50"
            >
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create rule"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
