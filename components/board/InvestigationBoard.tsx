"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Graph, Keyboard, MiniMap, Selection, type Edge, type Node } from "@antv/x6";
import { register } from "@antv/x6-react-shape";
import type { PivotRule } from "@prisma/client";
import type { BoardAnchor, BoardEdgeShape, BoardNodeShape, EntityNodeData } from "@/lib/board";
import { relationshipLabel } from "@/lib/edge-label-style";
import { EntityNode } from "@/components/board/EntityNode";
import { EntityDetailPanel } from "@/components/board/EntityDetailPanel";
import { BoardSelectionToolbar } from "@/components/board/BoardSelectionToolbar";
import { BoardControls } from "@/components/board/BoardControls";
import { safeZoomToFit } from "@/components/board/safe-zoom";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// Registered once at module scope (re-executes harmlessly on Fast Refresh — both
// calls below overwrite any existing registration rather than erroring on it).
register({ shape: "entity-node", component: EntityNode, effect: ["data"] });
Graph.registerEdge(
  "relationship-edge",
  {
    inherit: "edge",
    attrs: {
      line: {
        stroke: "var(--color-border)",
        strokeWidth: 1.5,
        targetMarker: { name: "classic", size: 7 },
      },
    },
  },
  true
);

// A first-time visitor to a shared board gets a one-off nudge toward
// fullscreen; a listener Set (matching lib/theme.ts's pattern) lets the
// dismissal re-render immediately without a page reload.
const hintListeners = new Set<() => void>();
function hintKey(token: string) {
  return `understand_fullscreen:${token}`;
}
function readHintDismissed(token: string) {
  try {
    return localStorage.getItem(hintKey(token)) === "1";
  } catch {
    return false;
  }
}
function dismissFullscreenHint(token: string) {
  try {
    localStorage.setItem(hintKey(token), "1");
  } catch {
    // Storage blocked (private window) — the hint just reappears next visit.
  }
  hintListeners.forEach((notify) => notify());
}
function subscribeHint(onChange: () => void) {
  hintListeners.add(onChange);
  return () => hintListeners.delete(onChange);
}

type Props = {
  caseId: number;
  initialNodes: BoardNodeShape[];
  initialEdges: BoardEdgeShape[];
  combinableRules: PivotRule[];
  readOnly: boolean;
  /** Set only for the anonymous share view — hides the "view full details" link (that page requires a session) and disables pivot suggestions in the entity panel. */
  shareToken?: string;
};

/** Attaches the edge tools an editor can drag: a waypoint on the curve (built-in
 *  `vertices` tool, persisted via its own onChanged callback — fires once per
 *  drag, not per pixel), and both endpoints (built-in arrowhead tools — dropping
 *  on a different entity reconnects it, dropping elsewhere on the *same* entity's
 *  boundary just re-anchors it; both are persisted uniformly by the caller's
 *  debounced `edge:change:source`/`edge:change:target` listeners). */
function attachEdgeTools(edge: Edge, onVerticesChanged: (edge: Edge) => void) {
  edge.setTools([
    {
      name: "vertices",
      args: {
        attrs: { r: 4, fill: "var(--color-accent)", stroke: "var(--color-surface)", strokeWidth: 1.5 },
        onChanged: (options: { edge: Edge }) => onVerticesChanged(options.edge),
      },
    },
    "source-arrowhead",
    "target-arrowhead",
  ]);
}

export function InvestigationBoard({
  caseId,
  initialNodes,
  initialEdges,
  combinableRules,
  readOnly,
  shareToken,
}: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphMountRef = useRef<HTMLDivElement>(null);
  const minimapMountRef = useRef<HTMLDivElement>(null);
  // Bumped once per graph-creation effect run — lets a deferred dispose() (below)
  // detect whether a newer run has already taken over the same containers before
  // it fires, so it never tears down a graph that superseded it.
  const graphGeneration = useRef(0);
  const [graph, setGraph] = useState<Graph | null>(null);

  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activeNodeData, setActiveNodeData] = useState<EntityNodeData | null>(null);
  // Multi-select (marquee/ctrl-click) — editors only, feeds the AND/OR combine toolbar.
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);
  const [relationType, setRelationType] = useState("");
  const [creatingEdge, setCreatingEdge] = useState(false);
  const [rearranging, setRearranging] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [counts, setCounts] = useState({ nodes: initialNodes.length, edges: initialEdges.length });

  const hintDismissed = useSyncExternalStore(
    subscribeHint,
    () => (shareToken ? readHintDismissed(shareToken) : true),
    () => true
  );
  const showFullscreenHint = Boolean(shareToken) && !hintDismissed && !isFullscreen;

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
      requestAnimationFrame(() => safeZoomToFit(graph));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [graph]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current?.requestFullscreen();
      }
    } catch {
      // Some embedding contexts (e.g. an iframe without the fullscreen permission) reject this outright.
    }
  }

  function goFullscreenFromHint() {
    if (shareToken) dismissFullscreenHint(shareToken);
    toggleFullscreen();
  }

  const showCombineToolbar = !readOnly && selectedValues.length >= 2 && combinableRules.length > 0;
  const showDetailPanel = Boolean(activeNodeId) && activeNodeData && !showCombineToolbar;

  function clearSelection() {
    graph?.cleanSelection();
    setSelectedValues([]);
  }

  function closeDetailPanel() {
    setActiveNodeId(null);
    setActiveNodeData(null);
  }

  async function rearrange() {
    setRearranging(true);
    try {
      await fetch(`/api/cases/${caseId}/board/rearrange`, { method: "POST" });
      router.refresh();
    } finally {
      setRearranging(false);
      setConfirmReset(false);
    }
  }

  async function confirmConnect() {
    if (!pendingConnection || !graph) return;
    setCreatingEdge(true);
    try {
      const res = await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          entityAId: Number(pendingConnection.source),
          entityBId: Number(pendingConnection.target),
          relationType: relationType.trim() || "related to",
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      const edge = graph.addEdge({
        id: String(created.id),
        shape: "relationship-edge",
        source: pendingConnection.source,
        target: pendingConnection.target,
        vertices: [],
        labels: [relationshipLabel(created.relationType)],
        data: { relationType: created.relationType },
      });
      attachEdgeTools(edge, persistVertices);
      setPendingConnection(null);
    } finally {
      setCreatingEdge(false);
    }
  }

  // Fires once per waypoint drag (the Vertices tool's own onChanged, not a raw
  // model-change event — those fire continuously while dragging).
  const persistVertices = useCallback((edge: Edge) => {
    if (!/^\d+$/.test(edge.id)) return; // provisional edge, not a persisted relationship yet
    fetch(`/api/relationships/${edge.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vertices: edge.getVertices() }),
    });
  }, []);

  // Dragging an endpoint (reconnect to a different entity, or re-anchor on the same
  // one) fires this repeatedly mid-drag — debounced per edge so one drag is one request.
  const anchorPatchTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const persistTerminal = useCallback((edgeId: string, side: "source" | "target", cellId: string, anchor: BoardAnchor) => {
    if (!/^\d+$/.test(edgeId)) return;
    const timers = anchorPatchTimers.current;
    const existing = timers.get(`${edgeId}:${side}`);
    if (existing) clearTimeout(existing);
    timers.set(
      `${edgeId}:${side}`,
      setTimeout(() => {
        timers.delete(`${edgeId}:${side}`);
        fetch(`/api/relationships/${edgeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            side === "source"
              ? { entityAId: Number(cellId), sourceAnchor: anchor }
              : { entityBId: Number(cellId), targetAnchor: anchor }
          ),
        });
      }, 350)
    );
  }, []);

  useEffect(() => {
    const container = graphMountRef.current;
    const minimapContainer = minimapMountRef.current;
    if (!container || !minimapContainer) return;

    const myGeneration = ++graphGeneration.current;

    // On a genuinely fresh browser tab, this effect can run before the
    // container has ever been given real on-screen dimensions (a layout race
    // with the browser's own first paint — reproduced concretely in a brand
    // new tab, not just a theoretical concern). Constructing the graph before
    // that happens permanently feeds a 0 into its fit-to-view math, which
    // both blanks the board and crashes the MiniMap plugin's own (unguarded)
    // reaction to it. So: don't construct anything until the container
    // reports a real size, polling one animation frame at a time.
    let cancelled = false;
    let pollId = 0;
    let currentGraph: Graph | null = null;

    function setup() {
      if (cancelled) return;
      const rect = container!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        pollId = requestAnimationFrame(setup);
        return;
      }

      const g = new Graph({
        container: container!,
        width: rect.width,
        height: rect.height,
        // Keeps the graph's size synced to the container via a ResizeObserver
        // for window resizes, fullscreen toggles, etc. after this initial mount.
        autoResize: true,
        background: { color: "transparent" },
        grid: { visible: true, size: 24, type: "dot", args: { color: "var(--color-border)", thickness: 1.5 } },
        panning: true,
        mousewheel: { enabled: true, modifiers: ["ctrl", "meta"] },
        interacting: readOnly
          ? {
              nodeMovable: false,
              edgeMovable: false,
              vertexMovable: false,
              vertexAddable: false,
              arrowheadMovable: false,
              magnetConnectable: false,
            }
          : true,
        connecting: {
          allowNode: !readOnly,
          allowBlank: false,
          allowEdge: false,
          allowLoop: false,
          allowPort: false,
          connectionPoint: "boundary",
          validateConnection: ({ sourceCell, targetCell }) =>
            !readOnly &&
            Boolean(sourceCell) &&
            Boolean(targetCell) &&
            sourceCell!.id !== targetCell!.id &&
            sourceCell!.isNode() &&
            targetCell!.isNode(),
        },
        highlighting: {
          magnetAvailable: {
            name: "stroke",
            args: { padding: 3, attrs: { stroke: "var(--color-accent)", strokeWidth: 2 } },
          },
        },
      });

      // Always installed (even read-only) so `graph.isSelected`/`cleanSelection` are
      // safe to call from EntityNode/this component either way — only its
      // interactivity (rubberband/click-select) is gated by `enabled`.
      g.use(
        new Selection({
          enabled: !readOnly,
          multiple: true,
          rubberband: !readOnly,
          showNodeSelectionBox: false,
          showEdgeSelectionBox: false,
          movable: false,
        })
      );

      if (!readOnly) {
        g.use(new Keyboard({ enabled: true }));
        g.bindKey(["Backspace", "Delete"], () => {
          const edgesToRemove = g.getSelectedCells().filter((c) => c.isEdge());
          if (edgesToRemove.length) g.removeCells(edgesToRemove);
        });
      }

      g.fromJSON({ nodes: initialNodes, edges: initialEdges });
      for (const edge of g.getEdges()) {
        if (!readOnly) attachEdgeTools(edge, persistVertices);
      }
      for (const node of g.getNodes()) {
        const data = node.getData<EntityNodeData>();
        node.setData({ ...data, readOnly }, { overwrite: true });
      }
      requestAnimationFrame(() => {
        safeZoomToFit(g);
        // Installed only after the graph has a confirmed real scale: MiniMap
        // reacts to the source graph's own 'resize' event by dividing by its
        // *current* scale (see @antv/x6's MiniMap.updatePaper) — attaching it
        // any earlier risks that scale still being the pre-fit default, which
        // has produced a divide-by-zero (non-finite SVGMatrix) crash here before.
        g.use(
          new MiniMap({
            container: minimapContainer!,
            width: 160,
            height: 120,
            padding: 8,
            // The plugin hardcodes its internal preview graph's own
            // `background: false` regardless of graphOptions, so the opaque
            // white that produces against dark theme is overridden in CSS
            // instead — see `.board-minimap .x6-widget-minimap` in globals.css.
          })
        );
      });

      g.on("node:click", ({ node }) => {
        setActiveNodeId(node.id);
        setActiveNodeData(node.getData<EntityNodeData>());
      });
      g.on("blank:click", () => {
        setActiveNodeId(null);
        setActiveNodeData(null);
      });

      g.on("node:moved", ({ node }) => {
        if (readOnly) return;
        const { x, y } = node.position();
        fetch(`/api/entities/${node.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ positionX: x, positionY: y }),
        });
      });

      g.on("selection:changed", ({ selected }) => {
        const values = selected
          .filter((cell) => cell.isNode())
          .map((cell) => (cell as Node).getData<EntityNodeData>().value);
        setSelectedValues(values);
      });

      g.on("edge:connected", ({ isNew, edge }) => {
        if (readOnly || !isNew) return;
        const sourceCellId = edge.getSourceCellId();
        const targetCellId = edge.getTargetCellId();
        g.removeCell(edge);
        if (!sourceCellId || !targetCellId) return;
        setRelationType("");
        setPendingConnection({ source: sourceCellId, target: targetCellId });
      });

      g.on("edge:change:source", ({ edge, current }) => {
        if (readOnly || !current || !("cell" in current) || !current.cell) return;
        const cellId = typeof current.cell === "string" ? current.cell : current.cell.id;
        persistTerminal(edge.id, "source", cellId, (current.anchor as BoardAnchor) ?? null);
      });
      g.on("edge:change:target", ({ edge, current }) => {
        if (readOnly || !current || !("cell" in current) || !current.cell) return;
        const cellId = typeof current.cell === "string" ? current.cell : current.cell.id;
        persistTerminal(edge.id, "target", cellId, (current.anchor as BoardAnchor) ?? null);
      });

      g.on("edge:removed", ({ edge }) => {
        if (readOnly || !/^\d+$/.test(edge.id)) return;
        fetch(`/api/relationships/${edge.id}`, { method: "DELETE" });
      });

      g.on("edge:selected", ({ edge }) => edge.attr({ line: { stroke: "var(--color-accent)", strokeWidth: 2 } }));
      g.on("edge:unselected", ({ edge }) =>
        edge.attr({ line: { stroke: "var(--color-border)", strokeWidth: 1.5 } })
      );

      const updateCounts = () => setCounts({ nodes: g.getNodes().length, edges: g.getEdges().length });
      g.on("node:added node:removed edge:added edge:removed", updateCounts);

      currentGraph = g;
      setGraph(g);
    }

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(pollId);
      setGraph(null);
      const g = currentGraph;
      if (!g) return; // setup() never got past waiting for a real container size
      // `dispose()` tears down the graph's internal state but — since this is a
      // container we own, not one it created — doesn't remove its own root
      // element from it; without clearing it ourselves, React's dev-mode
      // double-invoke (mount → cleanup → mount, synchronously, before either
      // of these queued callbacks below ever runs) would leave two overlapping
      // graphs (and doubled labels) behind once the *next* mount's `fromJSON`
      // renders into the same, still-occupied container.
      container.innerHTML = "";
      minimapContainer.innerHTML = "";
      // `g.dispose()` itself is deferred a tick: it synchronously unmounts every
      // x6-react-shape node's own React root, and doing that while React is
      // still mid-render elsewhere (e.g. the router.refresh() after Re-arrange
      // re-rendering this same tree) is exactly the race React 19 warns about
      // ("Attempted to synchronously unmount a root while React was already
      // rendering"). By the time this runs the DOM above is already gone, so
      // there's nothing left for a newer graph to collide with either way —
      // the generation check just skips disposing an object doing no more work.
      queueMicrotask(() => {
        // Deliberately reading the *current* ref value, not a stale snapshot —
        // that's the entire point of the check.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (graphGeneration.current === myGeneration) g.dispose();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges, readOnly]);

  // Keep every node's "active" flag (the guest single-click ring; editors ring via
  // the Selection plugin instead, tracked inside EntityNode itself) in sync.
  useEffect(() => {
    if (!graph) return;
    for (const node of graph.getNodes()) {
      const data = node.getData<EntityNodeData>();
      const active = node.id === activeNodeId;
      if (Boolean(data.active) !== active) node.setData({ ...data, active }, { overwrite: true });
    }
  }, [graph, activeNodeId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted whitespace-nowrap">
          {counts.nodes} {counts.nodes === 1 ? "entity" : "entities"} · {counts.edges}{" "}
          {counts.edges === 1 ? "relationship" : "relationships"}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={toggleFullscreen} className="btn btn-sm whitespace-nowrap">
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
          {!readOnly && (
            <button onClick={() => setConfirmReset(true)} className="btn btn-sm whitespace-nowrap">
              Re-arrange
            </button>
          )}
        </div>
      </div>

      <div ref={containerRef} className="board-canvas relative h-[70vh] card overflow-hidden">
        {showFullscreenHint && (
          <div className="card absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 flex items-center gap-3 max-w-[calc(100vw-1.5rem)]">
            <p className="text-sm">Tip: view this board in fullscreen for a clearer picture.</p>
            <button onClick={goFullscreenFromHint} className="btn btn-primary btn-sm shrink-0">
              Go fullscreen
            </button>
            <button
              onClick={() => shareToken && dismissFullscreenHint(shareToken)}
              className="btn btn-ghost btn-sm shrink-0"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        <div ref={graphMountRef} className="absolute inset-0" />
        <div ref={minimapMountRef} className="board-minimap absolute bottom-3 right-3 z-10 card overflow-hidden" />
        <BoardControls graph={graph} />

        {showDetailPanel && activeNodeData && (
          <EntityDetailPanel
            caseId={caseId}
            entityId={Number(activeNodeId)}
            data={activeNodeData}
            readOnly={readOnly}
            detailHref={shareToken ? undefined : `/cases/${caseId}/entities/${activeNodeId}`}
            showSuggestions={!shareToken}
            onClose={closeDetailPanel}
          />
        )}

        {showCombineToolbar && (
          <BoardSelectionToolbar
            selectedValues={selectedValues}
            combinableRules={combinableRules}
            onClear={clearSelection}
          />
        )}
      </div>

      <Modal
        open={pendingConnection !== null}
        onClose={() => setPendingConnection(null)}
        title="Describe this relationship"
      >
        <div className="space-y-3">
          <input
            autoFocus
            placeholder="e.g. found from, works with, same person as"
            value={relationType}
            onChange={(e) => setRelationType(e.target.value)}
            className="field"
            onKeyDown={(e) => e.key === "Enter" && confirmConnect()}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setPendingConnection(null)} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={confirmConnect} disabled={creatingEdge} className="btn btn-primary disabled:opacity-50">
              {creatingEdge ? "Linking…" : "Link entities"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmReset}
        busy={rearranging}
        title="Re-arrange the board?"
        message="This recalculates every entity's position and discards any manual arrangement."
        confirmLabel="Re-arrange"
        onCancel={() => setConfirmReset(false)}
        onConfirm={rearrange}
      />
    </div>
  );
}
