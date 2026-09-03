"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { EntityForm, type EntityFormValues } from "@/components/EntityForm";

type EntityFormModalProps = {
  caseId: number;
  /** Omit to create a new entity. */
  initial?: EntityFormValues;
};

export function EntityFormModal({ caseId, initial }: EntityFormModalProps) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(initial);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={isEdit ? "btn btn-row" : "btn btn-primary text-xs"}
      >
        {isEdit ? "Edit" : "Add entity"}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "Edit entity" : "Add entity"}
      >
        <EntityForm caseId={caseId} initial={initial} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
