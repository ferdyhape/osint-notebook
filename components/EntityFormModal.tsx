"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { EntityForm, type EntityFormValues } from "@/components/EntityForm";

type EntityFormModalProps = {
  caseId: number;
  /** Omit to create a new entity. */
  initial?: EntityFormValues;
  /** Where the trigger sits: a section header, a page header, or a table row. */
  placement?: "section" | "header" | "row";
};

export function EntityFormModal({ caseId, initial, placement = "section" }: EntityFormModalProps) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(initial);
  const triggerClass = placement === "row" ? "btn btn-row" : "btn btn-sm";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={triggerClass}
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
