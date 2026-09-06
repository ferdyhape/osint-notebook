import { useEffect, useState } from "react";
import type { Graph, Node } from "@antv/x6";
import type { EntityNodeData } from "@/lib/board";

const CHIP_COUNT = 6;

/** Deterministic per-type color so the same type always reads the same way, including custom types the user typed in. */
function chipIndex(type: string) {
  let hash = 0;
  for (let i = 0; i < type.length; i++) hash = (hash * 31 + type.charCodeAt(i)) >>> 0;
  return (hash % CHIP_COUNT) + 1;
}

/** Registered as the `entity-node` x6-react-shape — receives the live node/graph
 *  instances directly rather than React Flow's `data`/`selected` props, so this
 *  component reads its own data off the node and tracks selection itself. */
export function EntityNode({ node, graph }: { node: Node; graph: Graph }) {
  const data = node.getData<EntityNodeData>();
  const [selected, setSelected] = useState(() => graph.isSelected(node));

  useEffect(() => {
    const onSelectionChanged = () => setSelected(graph.isSelected(node));
    graph.on("selection:changed", onSelectionChanged);
    return () => {
      graph.off("selection:changed", onSelectionChanged);
    };
  }, [graph, node]);

  // Editors: ringed via the Selection plugin (marquee/ctrl-click aware). Guests
  // have no multi-select at all, so the parent instead marks the single clicked
  // node `active` directly in its data — either signal shows the same ring.
  const chip = chipIndex(data.type);
  const isRinged = selected || Boolean(data.active);

  return (
    <div className="relative w-full h-full">
      {/* A thin ring around the whole card, not a couple of fixed dots — drag from
       *  anywhere along it to start a connection. `data-magnet` is the exact
       *  attribute X6's event delegation looks for (see GraphView.events in
       *  @antv/x6); the card content below sits on top and stays a plain
       *  move-handle, so dragging the body still repositions the entity as before. */}
      {!data.readOnly && (
        <div data-magnet="true" className="entity-node-magnet absolute inset-0 rounded-[10px]" />
      )}
      <div
        className={`group card absolute inset-[16px] px-3.5 py-3 overflow-hidden transition-shadow ${
          isRinged ? "border-accent shadow-[0_0_0_2px_var(--color-accent)]" : "hover:border-text/30"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div
            className="flex items-center justify-center shrink-0 w-8 h-8 rounded-[8px] font-data text-[0.6875rem] font-semibold"
            style={{ background: `var(--chip-${chip}-bg)`, color: `var(--chip-${chip}-fg)` }}
            aria-hidden
          >
            {data.type.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow leading-none" title={data.type}>
              {data.type}
            </p>
            {data.label && (
              <p className="text-[0.8125rem] font-semibold mt-1 truncate" title={data.label}>
                {data.label}
              </p>
            )}
            <p
              className={
                data.label
                  ? "font-data text-xs text-muted truncate"
                  : "font-data text-[0.8125rem] font-semibold mt-1 truncate"
              }
              title={data.value}
            >
              {data.value}
            </p>
            {data.source && (
              <p className="text-xs text-muted mt-0.5 truncate" title={data.source}>
                {data.source}
              </p>
            )}
          </div>
        </div>

        {data.noteCount > 0 && (
          <div className="mt-2.5 pt-2 border-t border-border text-xs text-muted">
            {data.noteCount} {data.noteCount === 1 ? "note" : "notes"}
          </div>
        )}
      </div>
    </div>
  );
}
