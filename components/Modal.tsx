"use client";

import { useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, description, children }: ModalProps) {
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
      className="card w-[28rem] max-w-[calc(100vw-2rem)] p-0"
    >
      <div className="p-5 space-y-4">
        <div>
          <h2 className="section-title">{title}</h2>
          {description && <p className="text-sm text-muted mt-1">{description}</p>}
        </div>
        {children}
      </div>
    </dialog>
  );
}
