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
import type { Node, Edge } from "@xyflow/react";

export type BoardEntity = {
  id: number;
  type: string;
  value: string;
  source: string | null;
  positionX: number | null;
  positionY: number | null;
  noteCount: number;
  createdAt: Date;
};

export type BoardRelationship = {
  id: number;
  relationType: string;
  entityAId: number;
  entityBId: number;
  bendOffset: number;
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
  source: string | null;
  noteCount: number;
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
          source: true,
          positionX: true,
          positionY: true,
          createdAt: true,
          _count: { select: { notes: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      relationships: {
        select: { id: true, relationType: true, entityAId: true, entityBId: true, bendOffset: true },
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
    source: e.source,
    positionX: e.positionX,
    positionY: e.positionY,
    noteCount: e._count.notes,
    createdAt: e.createdAt,
  }));
  const relationships: BoardRelationship[] = found.relationships;
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

export function entitiesToNodes(
  entities: BoardEntity[],
  positions?: Record<number, { x: number; y: number }>
): Node<EntityNodeData>[] {
  return entities.map((e) => ({
    id: String(e.id),
    type: "entity",
    position:
      e.positionX !== null && e.positionY !== null
        ? { x: e.positionX, y: e.positionY }
        : positions?.[e.id] ?? { x: 0, y: 0 },
    data: { type: e.type, value: e.value, source: e.source, noteCount: e.noteCount },
  }));
}

export function relationshipsToEdges(relationships: BoardRelationship[]): Edge[] {
  return relationships.map((r) => ({
    id: String(r.id),
    type: "relationship",
    source: String(r.entityAId),
    target: String(r.entityBId),
    label: r.relationType,
    data: { bendOffset: r.bendOffset },
  }));
}
