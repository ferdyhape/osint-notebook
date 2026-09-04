"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type ShareRow = {
  id: number;
  role: string;
  invitedEmail: string | null;
  user: { id: number; name: string | null; email: string } | null;
};

type LinkShare = { id: number; linkToken: string } | null;

export function ShareModal({ caseId, open, onClose }: { caseId: number; open: boolean; onClose: () => void }) {
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [link, setLink] = useState<LinkShare>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [inviting, setInviting] = useState(false);

  const [linkBusy, setLinkBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  async function refresh() {
    try {
      const [sharesRes, linkRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/shares`),
        fetch(`/api/cases/${caseId}/shares/link`),
      ]);
      if (!sharesRes.ok || !linkRes.ok) throw new Error("Could not load sharing settings");
      setShares(await sharesRes.json());
      setLink(await linkRes.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([fetch(`/api/cases/${caseId}/shares`), fetch(`/api/cases/${caseId}/shares/link`)])
      .then(async ([sharesRes, linkRes]) => {
        if (!sharesRes.ok || !linkRes.ok) throw new Error("Could not load sharing settings");
        const [sharesData, linkData] = await Promise.all([sharesRes.json(), linkRes.json()]);
        if (cancelled) return;
        setShares(sharesData);
        setLink(linkData);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, caseId]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not send the invite");
      }
      setEmail("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(shareId: number, newRole: string) {
    await fetch(`/api/cases/${caseId}/shares/${shareId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    refresh();
  }

  async function removeShare(shareId: number) {
    setRemoveBusy(true);
    try {
      await fetch(`/api/cases/${caseId}/shares/${shareId}`, { method: "DELETE" });
      setRemoveId(null);
      await refresh();
    } finally {
      setRemoveBusy(false);
    }
  }

  async function toggleLink() {
    setLinkBusy(true);
    try {
      if (link) {
        await fetch(`/api/cases/${caseId}/shares/link`, { method: "DELETE" });
      } else {
        await fetch(`/api/cases/${caseId}/shares/link`, { method: "POST" });
      }
      await refresh();
    } finally {
      setLinkBusy(false);
    }
  }

  async function regenerateLink() {
    setLinkBusy(true);
    try {
      await fetch(`/api/cases/${caseId}/shares/link`, { method: "POST" });
      await refresh();
    } finally {
      setLinkBusy(false);
    }
  }

  function copyLink() {
    if (!link) return;
    const url = `${window.location.origin}/share/${link.linkToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Share this case">
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <div className="space-y-5">
            <form onSubmit={invite} className="space-y-2">
              <label className="label">Invite by email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field font-data flex-1"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
                  className="field w-auto"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button type="submit" disabled={inviting} className="btn btn-primary disabled:opacity-50">
                  {inviting ? "Sending…" : "Invite"}
                </button>
              </div>
            </form>

            {error && <p className="text-sm text-danger">{error}</p>}

            {shares.length > 0 && (
              <div className="space-y-2">
                <label className="label">People with access</label>
                <ul className="space-y-1.5">
                  {shares.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-data truncate">{s.user?.email || s.invitedEmail}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={s.role}
                          onChange={(e) => changeRole(s.id, e.target.value)}
                          className="field w-auto py-1 text-xs"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button onClick={() => setRemoveId(s.id)} className="btn btn-row btn-row-danger">
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="label">Anyone with the link</label>
                <button onClick={toggleLink} disabled={linkBusy} className="btn btn-sm disabled:opacity-50">
                  {link ? "Turn off" : "Turn on"}
                </button>
              </div>
              {link && (
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/share/${link.linkToken}`}
                    className="field font-data text-xs flex-1"
                    onFocus={(e) => e.target.select()}
                  />
                  <button onClick={copyLink} className="btn btn-sm">
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button onClick={regenerateLink} disabled={linkBusy} className="btn btn-sm">
                    Regenerate
                  </button>
                </div>
              )}
              <p className="text-xs text-muted">
                Anyone with this link can view the case read-only — no account needed.
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeId !== null}
        busy={removeBusy}
        title="Remove access?"
        message="This person will no longer be able to open this case."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => removeId !== null && removeShare(removeId)}
      />
    </>
  );
}
