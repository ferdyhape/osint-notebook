import "server-only";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
} from "d3-force";
import { prisma } from "@/lib/prisma";
import { relationshipLabel } from "@/lib/edge-label-style";
import { NODE_WIDTH, entityNodeHeight } from "@/lib/board-layout";

export { NODE_WIDTH, entityNodeHeight };

export type BoardEntity = {
  id: number;
  type: string;
  value: string;
  label: string | null;
  source: string | null;
  positionX: number | null;
  positionY: number | null;
  noteCount: number;
  createdAt: Date;
};

/** X6's own {name, args} anchor descriptor shape — opaque here, just persisted/replayed. */
export type BoardAnchor = { name: string; args?: Record<string, unknown> } | null;

export type BoardRelationship = {
  id: number;
  relationType: string;
  entityAId: number;
  entityBId: number;
  vertices: { x: number; y: number }[] | null;
  sourceAnchor: BoardAnchor;
  targetAnchor: BoardAnchor;
  /** X6 connector name — "smooth" draws a true curve through the waypoints; null is straight segments. */
  connector: string | null;
};

export type BoardNote = {
  id: number;
  content: string;
  createdAt: Date;
  entity: { id: number; type: string; value: string } | null;
};

export type EntityNodeData = {
  type: string;
  value: string;
  label: string | null;
  source: string | null;
  noteCount: number;
  /** Client-only, toggled at runtime — true while this is the guest's single
   *  clicked entity (guests have no multi-select, so there's no other selection
   *  signal to drive the card's ring from). Always absent/false from the server. */
  active?: boolean;
  /** Client-only — mirrors the board's readOnly prop so the node itself can hide
   *  its drag-to-connect ring for viewers/guests. Always absent from the server. */
  readOnly?: boolean;
};

/** One Prisma query shared by the owner-side board route and the public share route. */
export async function fetchCaseBoardData(caseId: number) {
  const found = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      owner: { select: { name: true, email: true } },
      entities: {
        select: {
          id: true,
          type: true,
          value: true,
          label: true,
          source: true,
          positionX: true,
          positionY: true,
          createdAt: true,
          _count: { select: { notes: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      relationships: {
        select: {
          id: true,
          relationType: true,
          entityAId: true,
          entityBId: true,
          vertices: true,
          sourceAnchor: true,
          targetAnchor: true,
          connector: true,
        },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          entity: { select: { id: true, type: true, value: true } },
        },
      },
    },
  });
  if (!found) return null;

  const entities: BoardEntity[] = found.entities.map((e) => ({
    id: e.id,
    type: e.type,
    value: e.value,
    label: e.label,
    source: e.source,
    positionX: e.positionX,
    positionY: e.positionY,
    noteCount: e._count.notes,
    createdAt: e.createdAt,
  }));
  const relationships: BoardRelationship[] = found.relationships.map((r) => ({
    id: r.id,
    relationType: r.relationType,
    entityAId: r.entityAId,
    entityBId: r.entityBId,
    vertices: (r.vertices as { x: number; y: number }[] | null) ?? null,
    sourceAnchor: r.sourceAnchor as BoardAnchor,
    targetAnchor: r.targetAnchor as BoardAnchor,
    connector: r.connector,
  }));
  const notes: BoardNote[] = found.notes;

  return {
    id: found.id,
    name: found.name,
    description: found.description,
    status: found.status,
    owner: found.owner,
    entities,
    relationships,
    notes,
  };
}

/** Serialisable note shape for the board's client bundle (`createdAt` as an ISO string). */
export type BoardNotePreview = { id: number; content: string; createdAt: string };

/** Notes grouped by the entity they're attached to. The board's detail panel renders
 *  these inline: an entity card shows "2 notes", and on a shared board there is no
 *  entity detail page to click through to — so without this, a guest can see that
 *  notes exist but never read them. */
export function notesByEntity(notes: BoardNote[]): Record<number, BoardNotePreview[]> {
  const grouped: Record<number, BoardNotePreview[]> = {};
  for (const note of notes) {
    if (!note.entity) continue;
    const bucket = (grouped[note.entity.id] ??= []);
    bucket.push({ id: note.id, content: note.content, createdAt: note.createdAt.toISOString() });
  }
  return grouped;
}

/** Synchronous one-shot force layout — not a live simulation. */
type LayoutNode = SimulationNodeDatum & { id: number };

export function computeForceLayout(
  entities: { id: number }[],
  relationships: { entityAId: number; entityBId: number }[]
): Record<number, { x: number; y: number }> {
  const nodes: LayoutNode[] = entities.map((e) => ({ id: e.id }));
  const links = relationships.map((r) => ({ source: r.entityAId, target: r.entityBId }));

  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink(links).id((d) => (d as LayoutNode).id).distance(160)
    )
    .force("charge", forceManyBody().strength(-320))
    .force("center", forceCenter(400, 300))
    .force("collide", forceCollide(70))
    .stop();

  for (let i = 0; i < 300; i++) simulation.tick();

  const positions: Record<number, { x: number; y: number }> = {};
  for (const n of nodes) {
    positions[n.id] = { x: n.x ?? 0, y: n.y ?? 0 };
  }
  return positions;
}

/** X6 node JSON — consumed directly by `graph.addNode()` / `Graph.fromJSON()`. */
export type BoardNodeShape = {
  id: string;
  shape: "entity-node";
  x: number;
  y: number;
  width: number;
  height: number;
  data: EntityNodeData;
};

export function entitiesToNodes(
  entities: BoardEntity[],
  positions?: Record<number, { x: number; y: number }>
): BoardNodeShape[] {
  return entities.map((e) => {
    const pos =
      e.positionX !== null && e.positionY !== null
        ? { x: e.positionX, y: e.positionY }
        : positions?.[e.id] ?? { x: 0, y: 0 };
    return {
      id: String(e.id),
      shape: "entity-node",
      x: pos.x,
      y: pos.y,
      width: NODE_WIDTH,
      height: entityNodeHeight(e),
      data: { type: e.type, value: e.value, label: e.label, source: e.source, noteCount: e.noteCount },
    };
  });
}

/** A concrete (non-null) anchor descriptor, as X6's own `source`/`target` config expects. */
export type BoardAnchorValue = { name: string; args?: Record<string, unknown> };

/** X6 edge JSON — consumed directly by `graph.addEdge()` / `Graph.fromJSON()`. */
export type BoardEdgeShape = {
  id: string;
  shape: "relationship-edge";
  source: { cell: string; anchor?: BoardAnchorValue };
  target: { cell: string; anchor?: BoardAnchorValue };
  vertices: { x: number; y: number }[];
  connector: string;
  labels: ReturnType<typeof relationshipLabel>[];
  data: { relationType: string };
};

export function relationshipsToEdges(relationships: BoardRelationship[]): BoardEdgeShape[] {
  return relationships.map((r) => ({
    id: String(r.id),
    shape: "relationship-edge",
    source: { cell: String(r.entityAId), anchor: r.sourceAnchor ?? undefined },
    target: { cell: String(r.entityBId), anchor: r.targetAnchor ?? undefined },
    vertices: r.vertices ?? [],
    connector: r.connector ?? "normal",
    labels: [relationshipLabel(r.relationType)],
    data: { relationType: r.relationType },
  }));
}
