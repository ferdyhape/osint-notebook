"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";

/** Restores a case from a JSON export produced by the Export menu — a brand
 *  new case, owned by whoever imports it. Every timestamp in the file is
 *  ignored; entities/relationships/notes are recreated with fresh ids. */
export function ImportCaseModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    entitiesCreated: number;
    relationshipsCreated: number;
    notesCreated: number;
  } | null>(null);

  function reset() {
    setFileName(null);
    setSubmitting(false);
    setError(null);
    setResult(null);
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const text = await file.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("That file isn't valid JSON");
      }
      const res = await fetch("/api/cases/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not import that file");
      setResult(data);
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        router.push(`/cases/${data.caseId}`);
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="btn btn-sm"
      >
        Import case
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Import a case"
        description="From a JSON export — creates a new case. Timestamps in the file are ignored."
      >
        <div className="space-y-3">
          <input
            key={open ? "open" : "closed"}
            type="file"
            accept="application/json,.json"
            disabled={submitting}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="field"
          />
          {fileName && !error && (
            <p className="text-xs text-muted">
              {submitting
                ? `Importing ${fileName}…`
                : result
                  ? `Imported ${fileName}: ${result.entitiesCreated} entities, ${result.relationshipsCreated} relationships, ${result.notesCreated} notes. Opening the case…`
                  : fileName}
            </p>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              {result ? "Close" : "Cancel"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
