"use client";

import { useState } from "react";
import { ShareModal } from "@/components/sharing/ShareModal";

export function ShareButton({ caseId }: { caseId: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-sm">
        Share
      </button>
      <ShareModal caseId={caseId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
