"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { EntityForm, type EntityFormValues } from "@/components/EntityForm";
import { IconEdit } from "@/components/icons";

type EntityFormModalProps = {
  caseId: number;
  /** Omit to create a new entity. */
  initial?: EntityFormValues;
  /** Where the trigger sits: a section header, a page header, or a table row
   *  (icon-only, so a row of actions reads as icons rather than a wall of text). */
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
        aria-label={isEdit ? "Edit entity" : "Add entity"}
        title={isEdit ? "Edit entity" : "Add entity"}
      >
        {placement === "row" ? <IconEdit /> : isEdit ? "Edit" : "Add entity"}
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
