"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BaseEdge, EdgeLabelRenderer, useReactFlow, type EdgeProps } from "@xyflow/react";

type RelationshipEdgeData = {
  bendOffset?: number;
  readOnly?: boolean;
};

export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  selected,
  markerEnd,
  data,
}: EdgeProps) {
  const { bendOffset: storedOffset = 0, readOnly = false } = (data as RelationshipEdgeData) ?? {};
  const { screenToFlowPosition, setEdges } = useReactFlow();
  // Non-null only while actively dragging; otherwise the curve just follows the persisted value.
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const dragging = dragOffset !== null;
  const liveOffset = dragOffset ?? storedOffset;
  // Captured once per drag: the midpoint + perpendicular unit vector the drag
  // offset is measured against, so the curve doesn't jump if the nodes move mid-drag.
  const dragRef = useRef<{ midX: number; midY: number; nx: number; ny: number } | null>(null);

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const controlX = midX + nx * liveOffset;
  const controlY = midY + ny * liveOffset;
  // Point at t=0.5 on the quadratic curve — used to keep the label centered
  // on the visible line rather than on the (usually off-curve) control point.
  const curveMidX = (midX + controlX) / 2;
  const curveMidY = (midY + controlY) / 2;

  const edgePath = `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`;

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<SVGCircleElement>) => {
      if (readOnly || event.button !== 0) return;
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { midX, midY, nx, ny };
      setDragOffset(storedOffset);
    },
    [readOnly, midX, midY, nx, ny, storedOffset]
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<SVGCircleElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      event.stopPropagation();
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const offset = (flowPos.x - drag.midX) * drag.nx + (flowPos.y - drag.midY) * drag.ny;
      setDragOffset(offset);
    },
    [screenToFlowPosition]
  );

  // Persists the current drag offset (or reverts to the last saved value on a cancelled
  // gesture) and always clears drag state — shared by pointerup and pointercancel so an
  // interrupted drag (e.g. the browser taking over for a system gesture) can't get stuck.
  const endDrag = useCallback(
    (event: ReactPointerEvent<SVGCircleElement>, commit: boolean) => {
      if (!dragRef.current) return;
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      // Read the drag offset from closure rather than a setDragOffset(prev => ...) updater —
      // an updater function runs during React's render phase, so calling another component's
      // setState (setEdges, here) from inside one triggers "setState while rendering a
      // different component". By the time this handler runs, `liveOffset` already reflects the
      // last pointermove's render, so it's safe to read directly.
      const resolved = liveOffset;
      setDragOffset(null);
      if (!commit || resolved === storedOffset) return;
      setEdges((eds) =>
        eds.map((e) => (e.id === id ? { ...e, data: { ...e.data, bendOffset: resolved } } : e))
      );
      fetch(`/api/relationships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bendOffset: resolved }),
      }).catch(() => {
        // A dropped network request just leaves the curve un-persisted server-side;
        // the next successful drag (or a reload) reconciles it. Nothing to surface here.
      });
    },
    [id, setEdges, liveOffset, storedOffset]
  );

  const onPointerUp = useCallback((event: ReactPointerEvent<SVGCircleElement>) => endDrag(event, true), [endDrag]);
  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<SVGCircleElement>) => endDrag(event, false),
    [endDrag]
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? "var(--color-accent)" : "var(--color-border)",
          strokeWidth: selected ? 2 : 1.5,
        }}
      />
      {!readOnly && (
        <>
          {/* Invisible, generously-sized hit target — the visual dot below stays small and
              calm, but grabbing it doesn't require pixel-perfect precision. */}
          <circle
            cx={controlX}
            cy={controlY}
            r={12}
            fill="transparent"
            style={{ cursor: dragging ? "grabbing" : "grab", pointerEvents: "all", touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          />
          <circle
            cx={controlX}
            cy={controlY}
            r={dragging ? 7 : 5}
            className="edge-bend-handle"
            data-active={dragging || selected}
            style={{
              fill: dragging ? "var(--color-accent)" : "var(--color-surface)",
              stroke: "var(--color-accent)",
              strokeWidth: 1.5,
              pointerEvents: "none",
            }}
          />
        </>
      )}
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="card px-2 py-1 text-xs font-medium leading-none whitespace-nowrap"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${curveMidX}px, ${curveMidY}px)`,
              pointerEvents: "none",
              color: selected ? "var(--color-accent)" : "var(--color-text)",
              borderColor: selected ? "var(--color-accent)" : "var(--color-border)",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
