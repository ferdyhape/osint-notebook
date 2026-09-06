"use client";

import { useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Content needing more breathing room (e.g. a row of controls) can ask for a wider dialog than the default. */
  width?: "default" | "wide";
};

const WIDTH = { default: "w-[28rem]", wide: "w-[34rem]" };

export function Modal({ open, onClose, title, description, children, width = "default" }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // A click that lands on the <dialog> element itself (not a child) hit the backdrop.
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      className={`card ${WIDTH[width]} max-w-[calc(100vw-2rem)] p-0`}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="section-title">{title}</h2>
            {description && <p className="text-sm text-muted mt-1">{description}</p>}
          </div>
          <button
            onClick={() => dialogRef.current?.close()}
            className="btn btn-ghost btn-sm shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
