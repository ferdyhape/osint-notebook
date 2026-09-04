"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type EdgeChange,
  type NodeMouseHandler,
  type OnNodeDrag,
  type OnReconnect,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import type { PivotRule } from "@prisma/client";
import type { EntityNodeData } from "@/lib/board";
import { EntityNode } from "@/components/board/EntityNode";
import { RelationshipEdge } from "@/components/board/RelationshipEdge";
import { EntityDetailPanel } from "@/components/board/EntityDetailPanel";
import { BoardSelectionToolbar } from "@/components/board/BoardSelectionToolbar";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const nodeTypes = { entity: EntityNode };
const edgeTypes = { relationship: RelationshipEdge };

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
  initialNodes: Node<EntityNodeData>[];
  initialEdges: Edge[];
  combinableRules: PivotRule[];
  readOnly: boolean;
  /** Set only for the anonymous share view — routes node detail lookups through the public token-scoped API instead of the authenticated one, and hides the "view full details" link (that page requires a session). */
  shareToken?: string;
};

function BoardInner({ caseId, initialNodes, initialEdges, combinableRules, readOnly, shareToken }: Props) {
  const router = useRouter();
  const { fitView } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  // Which node's detail panel is open — set only by an actual click, never by
  // a drag (React Flow tells those apart itself; onNodeClick doesn't fire for
  // a drag). Kept separate from React Flow's own multi-select below, which
  // otherwise used to also pop the panel open mid-drag.
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  // React Flow's native marquee/shift-click multi-select — editors only, used
  // solely to feed the AND/OR combine toolbar.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [relationType, setRelationType] = useState("");
  const [creatingEdge, setCreatingEdge] = useState(false);
  const [rearranging, setRearranging] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hintDismissed = useSyncExternalStore(
    subscribeHint,
    () => (shareToken ? readHintDismissed(shareToken) : true),
    () => true
  );
  const showFullscreenHint = Boolean(shareToken) && !hintDismissed && !isFullscreen;

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
      requestAnimationFrame(() => fitView({ padding: 0.3, duration: 200 }));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [fitView]);

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

  const activeNode = activeNodeId ? nodes.find((n) => n.id === activeNodeId) : null;
  const selectedValues = useMemo(
    () => nodes.filter((n) => selectedIds.includes(n.id)).map((n) => n.data.value),
    [nodes, selectedIds]
  );
  const showCombineToolbar = !readOnly && selectedValues.length >= 2 && combinableRules.length > 0;
  // Guests get no multi-select at all (elementsSelectable is off for them), so this only ever
  // needs to guard against the editor case where a marquee-select is in progress.
  const showDetailPanel = Boolean(activeNode) && !showCombineToolbar;

  // Editors' nodes carry React Flow's own selection flag (native marquee ring); guests have
  // selection turned off entirely, so the active node's ring is driven from state here instead.
  const displayNodes = useMemo(
    () => (readOnly ? nodes.map((n) => ({ ...n, selected: n.id === activeNodeId })) : nodes),
    [nodes, readOnly, activeNodeId]
  );

  const onSelectionChange = useCallback(({ nodes: sel }: OnSelectionChangeParams) => {
    setSelectedIds(sel.map((n) => n.id));
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setActiveNodeId(node.id);
  }, []);

  const onNodeDragStop: OnNodeDrag<Node<EntityNodeData>> = useCallback(
    (_event, node) => {
      if (readOnly) return;
      fetch(`/api/entities/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionX: node.position.x, positionY: node.position.y }),
      });
    },
    [readOnly]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly || !connection.source || !connection.target) return;
      setRelationType("");
      setPendingConnection(connection);
    },
    [readOnly]
  );

  async function confirmConnect() {
    if (!pendingConnection) return;
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
      setEdges((eds) =>
        addEdge(
          { id: String(created.id), type: "relationship", source: created.entityAId + "", target: created.entityBId + "", label: created.relationType },
          eds
        )
      );
      setPendingConnection(null);
    } finally {
      setCreatingEdge(false);
    }
  }

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (readOnly) return;
      for (const change of changes) {
        if (change.type === "remove") {
          fetch(`/api/relationships/${change.id}`, { method: "DELETE" });
        }
      }
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [readOnly, setEdges]
  );

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

  function closeDetailPanel() {
    setActiveNodeId(null);
  }

  function clearSelection() {
    setSelectedIds([]);
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
  }

  const onReconnect: OnReconnect = useCallback(
    async (oldEdge, newConnection) => {
      if (readOnly || !newConnection.source || !newConnection.target) return;
      const res = await fetch(`/api/relationships/${oldEdge.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityAId: Number(newConnection.source),
          entityBId: Number(newConnection.target),
        }),
      });
      if (!res.ok) return;
      setEdges((eds) =>
        eds.map((e) =>
          e.id === oldEdge.id ? { ...e, source: newConnection.source!, target: newConnection.target! } : e
        )
      );
    },
    [readOnly, setEdges]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted whitespace-nowrap">
          {nodes.length} {nodes.length === 1 ? "entity" : "entities"} · {edges.length}{" "}
          {edges.length === 1 ? "relationship" : "relationships"}
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

        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onSelectionChange={onSelectionChange}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          edgesReconnectable={!readOnly}
          deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
          defaultEdgeOptions={{ type: "relationship" }}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} color="var(--color-border)" />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            maskColor="rgba(0,0,0,0.06)"
            style={{ background: "var(--color-surface)" }}
          />
        </ReactFlow>

        {showDetailPanel && activeNode && (
          <EntityDetailPanel
            caseId={caseId}
            entityId={Number(activeNode.id)}
            data={activeNode.data}
            readOnly={readOnly}
            detailHref={shareToken ? undefined : `/cases/${caseId}/entities/${activeNode.id}`}
            pivotFetchUrl={
              shareToken ? `/api/share/${shareToken}/entities/${activeNode.id}/pivot-suggestions` : undefined
            }
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

export function InvestigationBoard(props: Props) {
  return (
    <ReactFlowProvider>
      <BoardInner {...props} />
    </ReactFlowProvider>
  );
}
