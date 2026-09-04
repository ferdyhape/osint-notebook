"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type EdgeChange,
  type NodeMouseHandler,
  type OnNodeDrag,
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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [relationType, setRelationType] = useState("");
  const [creatingEdge, setCreatingEdge] = useState(false);
  const [rearranging, setRearranging] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const selectedNode = selectedIds.length === 1 ? nodes.find((n) => n.id === selectedIds[0]) : null;
  const selectedValues = useMemo(
    () => nodes.filter((n) => selectedIds.includes(n.id)).map((n) => n.data.value),
    [nodes, selectedIds]
  );

  const onSelectionChange = useCallback(({ nodes: sel }: OnSelectionChangeParams) => {
    setSelectedIds(sel.map((n) => n.id));
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback(() => {
    // Selection state itself is handled by onSelectionChange; nothing extra needed here.
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

  function closePanel() {
    setSelectedIds([]);
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
  }

  return (
    <div className="relative h-[70vh] card overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable
        deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="var(--color-border)" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(0,0,0,0.06)"
          style={{ background: "var(--color-surface)" }}
        />
      </ReactFlow>

      {!readOnly && (
        <button
          onClick={() => setConfirmReset(true)}
          className="btn btn-sm absolute top-3 right-3 z-10"
        >
          Re-arrange
        </button>
      )}

      {selectedNode && (
        <EntityDetailPanel
          caseId={caseId}
          entityId={Number(selectedNode.id)}
          data={selectedNode.data}
          readOnly={readOnly}
          detailHref={shareToken ? undefined : `/cases/${caseId}/entities/${selectedNode.id}`}
          pivotFetchUrl={
            shareToken ? `/api/share/${shareToken}/entities/${selectedNode.id}/pivot-suggestions` : undefined
          }
          onClose={closePanel}
        />
      )}

      {!readOnly && (
        <BoardSelectionToolbar
          selectedValues={selectedValues}
          combinableRules={combinableRules}
          onClear={closePanel}
        />
      )}

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
