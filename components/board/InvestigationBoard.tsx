"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Graph, History, Keyboard, MiniMap, Selection, Snapline, type Edge, type Node } from "@antv/x6";
import { register } from "@antv/x6-react-shape";
import type { PivotRule } from "@prisma/client";
import type {
  BoardAnchor,
  BoardEdgeShape,
  BoardNodeShape,
  BoardNotePreview,
  EntityNodeData,
} from "@/lib/board";
import { relationshipLabel } from "@/lib/edge-label-style";
import { EntityNode } from "@/components/board/EntityNode";
import { EntityDetailPanel } from "@/components/board/EntityDetailPanel";
import { BoardSelectionToolbar } from "@/components/board/BoardSelectionToolbar";
import { BoardControls } from "@/components/board/BoardControls";
import { safeZoomToFit } from "@/components/board/safe-zoom";
import { BoardContextMenu, type ContextMenuItem } from "@/components/board/BoardContextMenu";
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

// Matches the dot spacing the old React Flow board used — kept as a plain
// CSS background (see `.board-grid-bg` in globals.css) rather than X6's own
// grid renderer, since that ties dot-spacing to the snap-to-grid increment.
const BOARD_GRID_SIZE = 24;

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

// Only these node/edge properties go on the undo stack. Adding or deleting a
// cell is a database write with its own generated id — undoing that in the
// canvas alone would silently desync the board from the case, so creation and
// deletion stay off the stack (both already sit behind their own confirmation).
const UNDOABLE_PROPS = new Set(["position", "vertices", "source", "target"]);

type Props = {
  caseId: number;
  initialNodes: BoardNodeShape[];
  initialEdges: BoardEdgeShape[];
  /** Notes keyed by entity id — rendered inline in the detail panel. */
  entityNotes: Record<number, BoardNotePreview[]>;
  combinableRules: PivotRule[];
  readOnly: boolean;
  /** Set only for the anonymous share view — hides the "view full details" link (that page requires a session) and disables pivot suggestions in the entity panel. */
  shareToken?: string;
};

// The endpoint handles are X6's arrowhead tools, whose shape is just an SVG path
// in `attrs.d` — left at the default they render as arrowheads at *both* ends of
// every edge, which reads as two conflicting direction arrows on a line like
// "found from". Overriding the path with a circle turns them into plain
// draw.io-style endpoint dots, leaving the edge's own target marker as the one
// and only arrow, so direction is unambiguous.
const ENDPOINT_HANDLE = "M -5 0 A 5 5 0 1 0 5 0 A 5 5 0 1 0 -5 0 Z";
const endpointHandleAttrs = {
  d: ENDPOINT_HANDLE,
  fill: "var(--color-accent)",
  stroke: "var(--color-surface)",
  "stroke-width": 1.5,
  cursor: "move",
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
        // `removable` (the default, spelled out here because the right-click
        // "Delete breakpoint" item advertises it) also makes double-clicking a
        // breakpoint delete it.
        removable: true,
        attrs: { r: 6, fill: "var(--color-accent)", stroke: "var(--color-surface)", strokeWidth: 1.5 },
        onChanged: (options: { edge: Edge }) => onVerticesChanged(options.edge),
      },
    },
    { name: "source-arrowhead", args: { attrs: endpointHandleAttrs } },
    { name: "target-arrowhead", args: { attrs: endpointHandleAttrs } },
  ]);
}

/** Index of the breakpoint the user right-clicked on, or -1 if the click didn't
 *  land near one. The threshold is in screen pixels, so it stays a comfortable
 *  target at any zoom level. */
const VERTEX_HIT_RADIUS = 14;
function vertexIndexNear(edge: Edge, local: { x: number; y: number }, scale: number) {
  const radius = VERTEX_HIT_RADIUS / (scale || 1);
  let index = -1;
  let closest = radius;
  edge.getVertices().forEach((vertex, i) => {
    const distance = Math.hypot(vertex.x - local.x, vertex.y - local.y);
    if (distance <= closest) {
      closest = distance;
      index = i;
    }
  });
  return index;
}

export function InvestigationBoard({
  caseId,
  initialNodes,
  initialEdges,
  entityNotes,
  combinableRules,
  readOnly,
  shareToken,
}: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphMountRef = useRef<HTMLDivElement>(null);
  const minimapMountRef = useRef<HTMLDivElement>(null);
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
  // Right-click menu — editors only (guests already get a read-only detail
  // panel via a plain click, with no edit actions to offer them here).
  const [contextMenu, setContextMenu] = useState<
    | { kind: "node"; id: string; x: number; y: number }
    | { kind: "edge"; id: string; x: number; y: number; vertexIndex: number }
    | null
  >(null);
  const [confirmDeleteEntity, setConfirmDeleteEntity] = useState<string | null>(null);
  const [deletingEntity, setDeletingEntity] = useState(false);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });

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
      graph.addEdge({
        id: String(created.id),
        shape: "relationship-edge",
        source: pendingConnection.source,
        target: pendingConnection.target,
        vertices: [],
        labels: [relationshipLabel(created.relationType)],
        data: { relationType: created.relationType },
      });
      // No tools attached here — like every other edge, this one grows its
      // handles on hover.
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

  function copyEntityValue(nodeId: string) {
    const value = graph?.getCellById(nodeId)?.getData<EntityNodeData>().value;
    if (value) navigator.clipboard.writeText(value).catch(() => {});
  }

  function viewEntityDetails(nodeId: string) {
    router.push(`/cases/${caseId}/entities/${nodeId}`);
  }

  async function confirmDeleteEntityAction() {
    if (!confirmDeleteEntity || !graph) return;
    setDeletingEntity(true);
    try {
      const res = await fetch(`/api/entities/${confirmDeleteEntity}`, { method: "DELETE" });
      if (res.ok) {
        const cell = graph.getCellById(confirmDeleteEntity);
        if (cell) graph.removeCell(cell);
        if (activeNodeId === confirmDeleteEntity) closeDetailPanel();
      }
    } finally {
      setDeletingEntity(false);
      setConfirmDeleteEntity(null);
    }
  }

  // A one-click alternative to manually dragging a waypoint into existence —
  // bends the line perpendicular to the straight path between the two
  // entities' current centers. Toggled off the same way, back to a straight line.
  function toggleEdgeCurve(edgeId: string) {
    if (!graph) return;
    const edge = graph.getCellById(edgeId);
    if (!edge || !edge.isEdge()) return;
    if (edge.getVertices().length > 0) {
      edge.setVertices([]);
      persistVertices(edge);
      return;
    }
    const sourceCellId = edge.getSourceCellId();
    const targetCellId = edge.getTargetCellId();
    if (!sourceCellId || !targetCellId) return;
    const a = graph.getCellById(sourceCellId);
    const b = graph.getCellById(targetCellId);
    if (!a?.isNode() || !b?.isNode()) return;
    const p1 = a.getBBox().getCenter();
    const p2 = b.getBBox().getCenter();
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = { x: (p1.x + p2.x) / 2 - (dy / len) * 60, y: (p1.y + p2.y) / 2 + (dx / len) * 60 };
    edge.setVertices([bend]);
    persistVertices(edge);
  }

  /** Removes the single breakpoint the right-click landed on, leaving the rest of
   *  the line's shape intact (double-clicking the handle does the same thing —
   *  this is the discoverable route to it). */
  function deleteEdgeVertex(edgeId: string, index: number) {
    const edge = graph?.getCellById(edgeId);
    if (!edge?.isEdge()) return;
    edge.removeVertexAt(index);
    persistVertices(edge);
  }

  function reverseEdgeDirection(edgeId: string) {
    if (!graph) return;
    const edge = graph.getCellById(edgeId);
    if (!edge || !edge.isEdge()) return;
    const sourceCellId = edge.getSourceCellId();
    const targetCellId = edge.getTargetCellId();
    if (!sourceCellId || !targetCellId) return;
    edge.setSource({ cell: targetCellId });
    edge.setTarget({ cell: sourceCellId });
    fetch(`/api/relationships/${edgeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityAId: Number(targetCellId), entityBId: Number(sourceCellId) }),
    });
  }

  function deleteEdge(edgeId: string) {
    const edge = graph?.getCellById(edgeId);
    if (edge) graph!.removeCell(edge); // fires "edge:removed", which persists the delete
  }

  useEffect(() => {
    const container = graphMountRef.current;
    const minimapContainer = minimapMountRef.current;
    if (!container || !minimapContainer) return;

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
    // Each graph gets its own throwaway host element inside our mount points.
    // `GraphView.dispose()` *empties whatever container it was given* — so
    // handing every graph the same persistent div means a disposing graph can
    // wipe out its successor's DOM. (Guarding dispose to avoid that instead
    // left the previous graph alive: React's dev double-invoke and every
    // router.refresh() then stacked up zombie graphs, all still listening on
    // `document` for mouse events — which is what made dragging, clicking and
    // even plain cursor movement behave like the mouse button was stuck down.)
    let host: HTMLDivElement | null = null;
    let minimapHost: HTMLDivElement | null = null;

    function setup() {
      if (cancelled) return;
      const rect = container!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        pollId = requestAnimationFrame(setup);
        return;
      }

      host = document.createElement("div");
      host.style.width = "100%";
      host.style.height = "100%";
      container!.appendChild(host);

      minimapHost = document.createElement("div");
      minimapHost.style.width = "100%";
      minimapHost.style.height = "100%";
      minimapContainer!.appendChild(minimapHost);

      const g = new Graph({
        container: host,
        width: rect.width,
        height: rect.height,
        // Keeps the graph's size synced to the container via a ResizeObserver
        // for window resizes, fullscreen toggles, etc. after this initial mount.
        autoResize: true,
        // X6 defaults both of these to 0 — meaning literally *any* pixel of
        // movement (real mouse/trackpad hardware essentially always reports
        // some jitter) immediately commits to "this is a drag", which read as
        // clicking-to-view-details being unreliable and dragging feeling
        // trigger-happy/ambiguous. A few pixels of tolerance is the standard
        // fix for exactly this class of complaint in pointer-driven UIs.
        moveThreshold: 4,
        clickThreshold: 4,
        background: { color: "transparent" },
        // X6 ties its grid's visual dot-spacing and its drag/reposition
        // snap-to-grid increment to the exact same `size` value — there's no
        // way to have one without the other. That silently snapped every
        // node move and every edge-endpoint drag to the nearest 24px, which
        // read as "dragging is buggy" (imprecise, jumpy positioning) since
        // the old React Flow board never snapped at all. Disabled here; the
        // dot pattern is drawn instead via CSS on the graph's own container
        // (see `.board-grid-bg` in globals.css), decoupled from any snapping.
        grid: false,
        // Without a floor, repeated zoom-out (the "−" button, or the wheel)
        // can drive the scale toward 0 — which then feeds a divide-by-zero
        // into the MiniMap plugin's own reaction to the graph's next resize
        // (a real, reproduced "non-finite SVGMatrix" crash). A sane min/max
        // makes that unreachable regardless of how zoom is triggered.
        scaling: { min: 0.15, max: 4 },
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

      // X6's autoResize ResizeObserver forwards whatever size the container
      // reports, including a transient 0 (the board detached, hidden, or
      // mid-fullscreen-transition). MiniMap.updatePaper then computes
      // `Math.min(maxWidth / 0, …)` → Infinity and feeds that straight into
      // targetGraph.translate() — which is exactly the reported
      // "Failed to set the 'e' property on 'SVGMatrix' … non-finite" error.
      // Both the observer and graph.resize() funnel through transform.resize,
      // so dropping non-positive sizes here closes off the whole class. A
      // zero-sized board has nothing to lay out anyway.
      const resizeTransform = g.transform.resize.bind(g.transform);
      g.transform.resize = (width?: number, height?: number) => {
        if ((width != null && !(width > 0)) || (height != null && !(height > 0))) return g.transform;
        return resizeTransform(width, height);
      };

      if (!readOnly) {
        // Undo/redo, scoped to geometry the board can replay against the server
        // (see UNDOABLE_PROPS). `beforeAddCommand` sees change events under the
        // single `cell:change:*` name with the real property in `args.key`.
        g.use(
          new History({
            enabled: true,
            stackSize: 60,
            ignoreAdd: true,
            ignoreRemove: true,
            beforeAddCommand: (event, args) =>
              event === "cell:change:*" && UNDOABLE_PROPS.has((args as { key?: string }).key ?? ""),
          })
        );
        const syncHistory = () => setHistory({ canUndo: g.canUndo(), canRedo: g.canRedo() });
        g.on("history:change", syncHistory);
        syncHistory();

        // An undo only rewinds the canvas — the server still holds the old
        // geometry until we push it back. Re-anchoring/reconnecting an edge is
        // already covered by the edge:change:source/target listeners below
        // (they fire on programmatic changes too), so this only has to cover
        // node positions and edge waypoints.
        const persistAfterHistory = ({ cmds }: { cmds: { data: { id?: string } }[] }) => {
          const ids = new Set(cmds.map((cmd) => cmd.data.id).filter(Boolean) as string[]);
          for (const id of ids) {
            if (!/^\d+$/.test(id)) continue;
            const cell = g.getCellById(id);
            if (!cell) continue;
            if (cell.isNode()) {
              const { x, y } = cell.position();
              fetch(`/api/entities/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ positionX: x, positionY: y }),
              });
            } else if (cell.isEdge()) {
              fetch(`/api/relationships/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vertices: cell.getVertices() }),
              });
            }
          }
        };
        g.on("history:undo", persistAfterHistory);
        g.on("history:redo", persistAfterHistory);

        g.use(new Keyboard({ enabled: true }));
        g.bindKey(["ctrl+z", "meta+z"], () => {
          g.undo();
          return false;
        });
        g.bindKey(["ctrl+shift+z", "meta+shift+z", "ctrl+y"], () => {
          g.redo();
          return false;
        });
        g.bindKey(["Backspace", "Delete"], () => {
          const edgesToRemove = g.getSelectedCells().filter((c) => c.isEdge());
          if (edgesToRemove.length) g.removeCells(edgesToRemove);
        });
        // Alignment guides while dragging a node — snaps it flush with a
        // neighbor's edge/center when within a few pixels, so tidying up the
        // board doesn't come down to eyeballing it.
        g.use(new Snapline({ enabled: true, sharp: true, tolerance: 8 }));
      }

      // X6's own `grid` background ties dot-spacing to the snap-to-grid
      // increment (disabled above), so the dots are drawn by hand instead —
      // panning/zooming synced to the graph's own transform so they still
      // move with the content exactly like a native grid would.
      const syncGridBg = () => {
        const scale = g.scale();
        const translation = g.translate();
        container!.style.backgroundSize = `${BOARD_GRID_SIZE * scale.sx}px ${BOARD_GRID_SIZE * scale.sy}px`;
        container!.style.backgroundPosition = `${translation.tx}px ${translation.ty}px`;
      };
      g.on("translate", syncGridBg);
      g.on("scale", syncGridBg);
      syncGridBg();

      // Edge tools are attached on hover/selection rather than up front (see the
      // edge:mouseenter handler) — a board where every edge permanently wears
      // three handles is both noisy and, with a dot sitting on the target
      // connection point, hides the very direction arrow it should be clarifying.
      g.fromJSON({ nodes: initialNodes, edges: initialEdges });
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
        // has produced a divide-by-zero (non-finite SVGMatrix) crash here
        // before. Also try/catch'd: the plugin's own reaction to a resize is
        // outside our control, and a missing minimap is purely cosmetic —
        // not worth crashing the whole board over.
        try {
          g.use(
            new MiniMap({
              container: minimapHost!,
              width: 160,
              height: 120,
              padding: 8,
              // The plugin hardcodes its internal preview graph's own
              // `background: false` regardless of graphOptions, so the opaque
              // white that produces against dark theme is overridden in CSS
              // instead — see `.board-minimap .x6-widget-minimap` in globals.css.
            })
          );
        } catch {
          // See above.
        }
      });

      g.on("node:click", ({ node }) => {
        setActiveNodeId(node.id);
        setActiveNodeData(node.getData<EntityNodeData>());
      });
      g.on("blank:click", () => {
        setActiveNodeId(null);
        setActiveNodeData(null);
      });

      if (!readOnly) {
        // `e.buttons` is a bitmask of buttons still held down — a genuine
        // right-click reports just the right button; a trackpad's two-finger
        // tap gesture sometimes fires a contextmenu event while the left
        // button is *also* still down mid-drag, which briefly hijacked the
        // drag into a menu popping up instead. Ignore those.
        const isPlainRightClick = (e: { buttons: number }) => e.buttons === 0 || e.buttons === 2;
        g.on("node:contextmenu", ({ e, node }) => {
          e.preventDefault();
          if (!isPlainRightClick(e)) return;
          setContextMenu({ kind: "node", id: node.id, x: e.clientX, y: e.clientY });
        });
        g.on("edge:contextmenu", ({ e, edge }) => {
          e.preventDefault();
          if (!isPlainRightClick(e)) return;
          const local = g.clientToLocal(e.clientX, e.clientY);
          setContextMenu({
            kind: "edge",
            id: edge.id,
            x: e.clientX,
            y: e.clientY,
            vertexIndex: vertexIndexNear(edge, local, g.scale().sx),
          });
        });
        g.on("blank:contextmenu", ({ e }) => {
          e.preventDefault();
          setContextMenu(null);
        });
      }

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

      g.on("edge:selected", ({ edge }) => {
        edge.attr({ line: { stroke: "var(--color-accent)", strokeWidth: 2 } });
        if (!readOnly) attachEdgeTools(edge, persistVertices);
      });
      g.on("edge:unselected", ({ edge }) => {
        edge.attr({ line: { stroke: "var(--color-border)", strokeWidth: 1.5 } });
        if (!readOnly) edge.removeTools();
      });

      if (!readOnly) {
        // Hovering an edge reveals its handles; leaving hides them again unless
        // it's selected. X6 stops routing pointer events through the graph view
        // while a tool is mid-drag, so `edge:mouseleave` can't fire out from
        // under a drag and pull the handle away.
        g.on("edge:mouseenter", ({ edge }) => attachEdgeTools(edge, persistVertices));
        g.on("edge:mouseleave", ({ edge }) => {
          if (!g.isSelected(edge)) edge.removeTools();
        });
      }

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
      // Detach this graph's own host elements immediately, so the next mount
      // starts from a clean container even though the dispose below is
      // deferred. Because each graph owns a private host, disposing it later
      // can't reach into whatever replaced it.
      host?.remove();
      minimapHost?.remove();
      // `dispose()` is deferred a tick: it synchronously unmounts every
      // x6-react-shape node's own React root, and doing that while React is
      // still mid-render elsewhere (e.g. the router.refresh() after Re-arrange
      // re-rendering this same tree) is exactly the race React 19 warns about
      // ("Attempted to synchronously unmount a root while React was already
      // rendering"). It must always run though — skipping it leaves the graph's
      // `document`-level mouse listeners, Selection plugin and ResizeObserver
      // alive forever, which is what made input feel stuck and chaotic.
      queueMicrotask(() => g.dispose());
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

  const contextMenuItems: ContextMenuItem[] = (() => {
    if (!contextMenu) return [];
    if (contextMenu.kind === "node") {
      const id = contextMenu.id;
      return [
        { label: "View details", onClick: () => viewEntityDetails(id) },
        { label: "Copy value", onClick: () => copyEntityValue(id) },
        { label: "Delete entity", danger: true, onClick: () => setConfirmDeleteEntity(id) },
      ];
    }
    const id = contextMenu.id;
    const edge = graph?.getCellById(id);
    const bendCount = edge?.isEdge() ? edge.getVertices().length : 0;
    const { vertexIndex } = contextMenu;
    return [
      ...(vertexIndex >= 0
        ? [{ label: "Delete breakpoint", onClick: () => deleteEdgeVertex(id, vertexIndex) }]
        : []),
      { label: bendCount > 0 ? "Straighten line" : "Curve this line", onClick: () => toggleEdgeCurve(id) },
      { label: "Reverse direction", onClick: () => reverseEdgeDirection(id) },
      { label: "Delete relationship", danger: true, onClick: () => deleteEdge(id) },
    ];
  })();

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

        <div ref={graphMountRef} className="board-grid-bg absolute inset-0" />
        <div ref={minimapMountRef} className="board-minimap absolute bottom-3 right-3 z-10 card overflow-hidden" />
        <BoardControls
          graph={graph}
          showHistory={!readOnly}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={() => graph?.undo()}
          onRedo={() => graph?.redo()}
        />

        {showDetailPanel && activeNodeData && (
          <EntityDetailPanel
            caseId={caseId}
            entityId={Number(activeNodeId)}
            data={activeNodeData}
            notes={entityNotes[Number(activeNodeId)] ?? []}
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

      <ConfirmDialog
        open={confirmDeleteEntity !== null}
        busy={deletingEntity}
        title="Delete this entity?"
        message="This removes it (and its relationships and notes) from the case entirely — not just from the board."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteEntity(null)}
        onConfirm={confirmDeleteEntityAction}
      />

      {contextMenu && (
        <BoardContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
