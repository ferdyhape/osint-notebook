"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddNoteForm({
  caseId,
  entityId,
  onDone,
}: {
  caseId: number;
  entityId?: number;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, entityId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save the note");
      }
      setContent("");
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
      <textarea
        required
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="What did you find?"
        className="field"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        {onDone && (
          <button type="button" onClick={onDone} className="btn btn-ghost">
            Cancel
          </button>
        )}
        <button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-50">
          {submitting ? "Saving…" : "Add note"}
        </button>
      </div>
    </form>
  );
}
