"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function DeleteEntityButton({
  entityId,
  entityValue,
  redirectTo,
}: {
  entityId: number;
  entityValue: string;
  /** Navigate here after deleting — used when deleting from the entity's own page. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/entities/${entityId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete the entity");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-row btn-row-danger">
        Delete
      </button>

      <ConfirmDialog
        open={open}
        busy={busy}
        error={error}
        title="Delete this entity?"
        message={
          <>
            <span className="font-data text-text">{entityValue}</span> and its notes and links to
            other entities will be permanently deleted.
          </>
        }
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
