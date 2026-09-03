"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function DeleteCaseButton({ caseId, caseName }: { caseId: number; caseName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete the case");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-danger text-xs">
        Delete
      </button>

      <ConfirmDialog
        open={open}
        busy={busy}
        error={error}
        title="Delete this case?"
        message={
          <>
            <span className="font-medium text-text">{caseName}</span> and every entity, link, and
            note inside it will be permanently deleted.
          </>
        }
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
