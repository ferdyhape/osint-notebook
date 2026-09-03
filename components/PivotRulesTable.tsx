"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PivotRuleFormModal, type PivotRuleValues } from "@/components/PivotRuleFormModal";

export function PivotRulesTable({ rules }: { rules: PivotRuleValues[] }) {
  const router = useRouter();
  const [confirmRule, setConfirmRule] = useState<PivotRuleValues | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirmRule) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/pivot-rules/${confirmRule.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete the rule");
      setConfirmRule(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (rules.length === 0) {
    return (
      <div className="card border-dashed p-8 text-center">
        <p className="text-sm text-muted">No rules yet.</p>
      </div>
    );
  }

  const grouped = rules.reduce<Record<string, PivotRuleValues[]>>((acc, r) => {
    (acc[r.entityType] ??= []).push(r);
    return acc;
  }, {});

  return (
    <>
      <div className="space-y-6">
        {Object.entries(grouped).map(([entityType, group]) => (
          <div key={entityType}>
            <h3 className="badge mb-2">{entityType}</h3>
            <div className="card divide-y divide-border">
              {group.map((r) => (
                <div key={r.id} className="group p-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="item-title">{r.title}</p>
                      <span className="font-data text-[0.6875rem] text-muted uppercase">
                        {r.category} · {r.actionType}
                      </span>
                      {r.combinable && (
                        <span className="font-data text-[0.6875rem] uppercase text-accent bg-accent-soft rounded-full px-2 py-0.5">
                          combinable
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted mt-0.5">{r.description}</p>
                    {r.urlTemplate && (
                      <code className="block mt-1 font-data text-xs text-muted break-all">
                        {r.urlTemplate}
                      </code>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <PivotRuleFormModal initial={r} />
                    <button
                      onClick={() => setConfirmRule(r)}
                      className="btn btn-row btn-row-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmRule !== null}
        busy={busy}
        error={error}
        title="Delete this rule?"
        message={
          <>
            <span className="font-medium text-text">{confirmRule?.title}</span> will no longer be
            suggested. Entities and notes are not affected.
          </>
        }
        onCancel={() => setConfirmRule(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
