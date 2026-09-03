"use client";

import { useEffect, useRef, useState } from "react";

export function ExportMenu({ caseId }: { caseId: number }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn btn-sm"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Export
      </button>

      {open && (
        <div role="menu" className="menu-panel">
          {/* Plain links so the browser handles the download and sends the session cookie. */}
          <div className="p-1">
            <a
              role="menuitem"
              href={`/api/cases/${caseId}/export`}
              onClick={() => setOpen(false)}
              className="menu-item"
            >
              Markdown report
              <span className="block text-xs text-muted">Readable summary of the whole case</span>
            </a>
            <a
              role="menuitem"
              href={`/api/cases/${caseId}/export?format=json`}
              onClick={() => setOpen(false)}
              className="menu-item"
            >
              JSON
              <span className="block text-xs text-muted">Every field, for backup or reuse</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
