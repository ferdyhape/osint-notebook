"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";

type CaseFormModalProps = {
  /** Omit to create a new case. */
  initial?: { id: number; name: string; description: string | null; status: string };
  trigger?: "primary" | "header";
};

export function CaseFormModal({ initial, trigger = "primary" }: CaseFormModalProps) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openForm() {
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setStatus(initial?.status ?? "active");
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(isEdit ? `/api/cases/${initial!.id}` : "/api/cases", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          ...(isEdit && { status }),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save the case");
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
      <button
        onClick={openForm}
        className={trigger === "primary" ? "btn btn-primary" : "btn btn-sm"}
      >
        {isEdit ? "Edit" : "New case"}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? "Edit case" : "New case"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              placeholder="Fake account investigation"
            />
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field"
              rows={3}
            />
          </div>

          {isEdit && (
            <div>
              <label className="label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="field">
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
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
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create case"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
