"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DetectedEntity } from "@/lib/detect";

export function DetectedEntitiesBanner({
  caseId,
  detected,
}: {
  caseId: number;
  detected: DetectedEntity[];
}) {
  const router = useRouter();
  const [addingValue, setAddingValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (detected.length === 0) return null;

  async function addEntity(item: DetectedEntity) {
    setAddingValue(item.value);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/entities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: item.type,
          value: item.value,
          source: "Found in case details",
        }),
      });
      if (!res.ok) throw new Error("Could not add the entity");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAddingValue(null);
    }
  }

  return (
    <div className="card bg-accent-soft px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted">Found in this case:</span>
        {detected.map((item) => (
          <div key={`${item.type}:${item.value}`} className="flex items-center gap-2">
            <span className="badge">{item.type}</span>
            <span className="font-data text-[0.8125rem]">{item.value}</span>
            <button
              onClick={() => addEntity(item)}
              disabled={addingValue === item.value}
              className="btn btn-sm disabled:opacity-50"
            >
              {addingValue === item.value ? "Adding…" : "Add as entity"}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </div>
  );
}
