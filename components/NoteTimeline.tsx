"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type NoteRow = {
  id: number;
  content: string;
  createdAt: string;
  entity?: { id: number; type: string; value: string } | null;
};

export function NoteTimeline({ notes }: { notes: NoteRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (notes.length === 0) {
    return (
      <div className="card border-dashed p-8 text-center">
        <p className="text-sm text-muted">No notes yet.</p>
      </div>
    );
  }

  function startEdit(note: NoteRow) {
    setEditingId(note.id);
    setDraft(note.content);
    setError(null);
  }

  async function saveEdit(noteId: number) {
    setBusyId(noteId);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      if (!res.ok) throw new Error("Could not save the note");
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNote(noteId: number) {
    setBusyId(noteId);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete the note");
      setConfirmId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="card p-3.5 group">
            {editingId === n.id ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  className="field"
                />
                {error && <p className="text-sm text-danger">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="btn btn-ghost text-xs">
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(n.id)}
                    disabled={busyId === n.id}
                    className="btn btn-primary text-xs disabled:opacity-50"
                  >
                    {busyId === n.id ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(n)} className="btn btn-row">
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmId(n.id)}
                      className="btn btn-row btn-row-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <span className="font-data">{new Date(n.createdAt).toLocaleString("en-GB")}</span>
                  {n.entity && (
                    <span className="badge">
                      {n.entity.type}: {n.entity.value}
                    </span>
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmId !== null}
        busy={busyId !== null && busyId === confirmId}
        error={confirmId !== null ? error : null}
        title="Delete this note?"
        message="The note will be permanently deleted."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteNote(confirmId)}
      />
    </>
  );
}
