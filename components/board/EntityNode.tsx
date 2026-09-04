import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { EntityNodeData } from "@/lib/board";

type EntityNode = Node<EntityNodeData, "entity">;

const TYPE_GLYPH: Record<string, string> = {
  email: "@",
  username: "u/",
  domain: "◈",
  ip: "ip",
  phone: "☎",
  person: "☺",
  organization: "▣",
  address: "⌂",
  image: "▧",
};

export function EntityNode({ data, selected }: NodeProps<EntityNode>) {
  return (
    <div
      className={`card px-3 py-2.5 rounded-[10px] min-w-[9rem] max-w-[14rem] transition-colors ${
        selected ? "border-accent bg-accent-soft" : "hover:border-text/40"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-border !border-border !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-border !border-border !w-2 !h-2" />

      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`font-data text-[0.6875rem] shrink-0 ${selected ? "text-accent" : "text-muted"}`}
          aria-hidden
        >
          {TYPE_GLYPH[data.type] ?? "•"}
        </span>
        <span className="badge shrink-0">{data.type}</span>
      </div>
      <p className="font-data text-[0.8125rem] font-medium mt-1.5 truncate" title={data.value}>
        {data.value}
      </p>
      {data.source && <p className="text-xs text-muted mt-0.5 truncate">{data.source}</p>}
      {data.noteCount > 0 && (
        <span className="badge mt-1.5 inline-block">
          {data.noteCount} {data.noteCount === 1 ? "note" : "notes"}
        </span>
      )}
    </div>
  );
}
