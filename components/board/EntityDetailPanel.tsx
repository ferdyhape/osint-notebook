import Link from "next/link";
import { PivotSuggestionsPanel } from "@/components/PivotSuggestionsPanel";
import type { EntityNodeData } from "@/lib/board";

type Props = {
  caseId: number;
  entityId: number;
  data: EntityNodeData;
  readOnly: boolean;
  detailHref?: string;
  pivotFetchUrl?: string;
  onClose: () => void;
};

export function EntityDetailPanel({
  caseId,
  entityId,
  data,
  readOnly,
  detailHref,
  pivotFetchUrl,
  onClose,
}: Props) {
  return (
    <aside className="card absolute top-3 right-3 bottom-3 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-y-auto p-4 space-y-4 z-10">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="badge">{data.type}</span>
          <p className="font-data text-sm font-medium mt-1.5 break-all">{data.value}</p>
          {data.source && <p className="text-xs text-muted mt-0.5">Source: {data.source}</p>}
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-sm shrink-0" aria-label="Close">
          ✕
        </button>
      </div>

      {detailHref && (
        <Link href={detailHref} className="btn btn-sm w-full justify-center">
          View full details →
        </Link>
      )}

      <div className="space-y-2">
        <h3 className="section-title text-sm">Suggested next steps</h3>
        <PivotSuggestionsPanel caseId={caseId} entityId={entityId} readOnly={readOnly} fetchUrl={pivotFetchUrl} />
      </div>
    </aside>
  );
}
