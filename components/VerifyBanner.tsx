"use client";

import { useState, useSyncExternalStore } from "react";

const DISMISS_KEY = "verify-banner-dismissed";
const listeners = new Set<() => void>();

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function VerifyBanner() {
  // false until hydration, so the banner never contradicts the rendered page.
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (dismissed) return null;

  async function resend() {
    setSending(true);
    try {
      const res = await fetch("/api/auth/verify/resend", { method: "POST" });
      if (res.ok) setSent(true);
    } finally {
      setSending(false);
    }
  }

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage blocked (private window) — the banner just won't stay dismissed.
    }
    listeners.forEach((notify) => notify());
  }

  return (
    <div className="bg-accent-soft border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-2 flex items-center justify-between gap-4 text-sm">
        <span>
          {sent ? "Verification email sent — check your inbox." : "Verify your email to secure your account."}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          {!sent && (
            <button onClick={resend} disabled={sending} className="btn btn-row disabled:opacity-50">
              {sending ? "Sending…" : "Resend email"}
            </button>
          )}
          <button onClick={dismiss} className="btn btn-row" aria-label="Dismiss">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
