import Link from "next/link";
import { PivotSuggestionsPanel } from "@/components/PivotSuggestionsPanel";
import { CopyButton } from "@/components/CopyButton";
import { isUrlValue } from "@/lib/pivot";
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
          <p className="text-sm font-medium mt-1.5 break-all">
            {isUrlValue(data.value) ? (
              <a
                href={data.value}
                target="_blank"
                rel="noopener noreferrer"
                className="font-data hover:text-accent hover:underline"
              >
                {data.value}
              </a>
            ) : (
              <span className="font-data">{data.value}</span>
            )}
          </p>
          {data.source && <p className="text-xs text-muted mt-0.5">Source: {data.source}</p>}
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-sm shrink-0" aria-label="Close">
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2">
        <CopyButton value={data.value} className="btn btn-sm flex-1 justify-center" />
        {detailHref && (
          <Link href={detailHref} className="btn btn-sm flex-1 justify-center">
            View details →
          </Link>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="item-title">Suggested next steps</h3>
        <PivotSuggestionsPanel caseId={caseId} entityId={entityId} readOnly={readOnly} fetchUrl={pivotFetchUrl} />
      </div>
    </aside>
  );
}
