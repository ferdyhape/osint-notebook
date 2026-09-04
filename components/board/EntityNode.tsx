import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { EntityNodeData } from "@/lib/board";

type EntityNode = Node<EntityNodeData, "entity">;

const CHIP_COUNT = 6;

/** Deterministic per-type color so the same type always reads the same way, including custom types the user typed in. */
function chipIndex(type: string) {
  let hash = 0;
  for (let i = 0; i < type.length; i++) hash = (hash * 31 + type.charCodeAt(i)) >>> 0;
  return (hash % CHIP_COUNT) + 1;
}

export function EntityNode({ data, selected }: NodeProps<EntityNode>) {
  const chip = chipIndex(data.type);

  return (
    <div
      className={`group card px-3.5 py-3 min-w-[13rem] max-w-[17rem] transition-shadow ${
        selected ? "border-accent shadow-[0_0_0_2px_var(--color-accent)]" : "hover:border-text/30"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-surface !border !border-border transition-transform group-hover:scale-125"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-surface !border !border-border transition-transform group-hover:scale-125"
      />

      <div className="flex items-start gap-2.5">
        <div
          className="flex items-center justify-center shrink-0 w-8 h-8 rounded-[8px] font-data text-[0.6875rem] font-semibold"
          style={{ background: `var(--chip-${chip}-bg)`, color: `var(--chip-${chip}-fg)` }}
          aria-hidden
        >
          {data.type.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow leading-none">{data.type}</p>
          <p className="font-data text-[0.8125rem] font-semibold mt-1 truncate" title={data.value}>
            {data.value}
          </p>
          {data.source && <p className="text-xs text-muted mt-0.5 truncate">{data.source}</p>}
        </div>
      </div>

      {data.noteCount > 0 && (
        <div className="mt-2.5 pt-2 border-t border-border text-xs text-muted">
          {data.noteCount} {data.noteCount === 1 ? "note" : "notes"}
        </div>
      )}
    </div>
  );
}
