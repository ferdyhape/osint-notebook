"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AddNoteForm } from "@/components/notes/AddNoteForm";

export function AddNoteModalButton({ caseId, entityId }: { caseId: number; entityId?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-sm">
        Add note
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add note">
        <AddNoteForm caseId={caseId} entityId={entityId} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
