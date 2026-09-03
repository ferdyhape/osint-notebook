"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Feedback = { kind: "ok" | "error"; text: string } | null;

export function ProfileDetailsForm({
  initial,
}: {
  initial: { email: string; name: string | null };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name ?? "");
  const [email, setEmail] = useState(initial.email);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save your profile");
      setFeedback({ kind: "ok", text: "Profile saved." });
      router.refresh();
    } catch (err) {
      setFeedback({
        kind: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <div>
        <label className="label">Name (optional)</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="field" />
      </div>
      <div>
        <label className="label">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field font-data"
        />
      </div>
      {feedback && (
        <p className={`text-sm ${feedback.kind === "ok" ? "text-accent" : "text-danger"}`}>
          {feedback.text}
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-50">
          {submitting ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ kind: "error", text: "The new passwords do not match" });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not change your password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback({ kind: "ok", text: "Password changed." });
    } catch (err) {
      setFeedback({
        kind: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <div>
        <label className="label">Current password</label>
        <input
          required
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="field"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">New password</label>
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="field"
          />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="field"
          />
        </div>
      </div>
      <p className="text-xs text-muted">At least 8 characters.</p>
      {feedback && (
        <p className={`text-sm ${feedback.kind === "ok" ? "text-accent" : "text-danger"}`}>
          {feedback.text}
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-50">
          {submitting ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
