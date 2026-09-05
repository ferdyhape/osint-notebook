import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCaseAccess } from "@/lib/case-access";

type Params = { params: Promise<{ relationshipId: string }> };

/** Dragging an edge endpoint to a different node (React Flow's "reconnect") re-points it here. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { relationshipId } = await params;
  const id = Number(relationshipId);

  const relationship = await prisma.relationship.findUnique({ where: { id }, select: { caseId: true } });
  if (!relationship) return NextResponse.json({ error: "not found" }, { status: 404 });

  const access = await requireCaseAccess(relationship.caseId, "editor");
  if (!access.ok) return access.response;

  const body = await request.json();
  const { entityAId, entityBId, relationType, bendOffset } = body;

  if (entityAId !== undefined && entityBId !== undefined && Number(entityAId) === Number(entityBId)) {
    return NextResponse.json({ error: "Two distinct entities are required" }, { status: 400 });
  }
  if (entityAId !== undefined || entityBId !== undefined) {
    const ids = [entityAId, entityBId].filter((v) => v !== undefined).map(Number);
    const count = await prisma.entity.count({ where: { id: { in: ids }, caseId: relationship.caseId } });
    if (count !== ids.length) {
      return NextResponse.json({ error: "Both entities must belong to this case" }, { status: 400 });
    }
  }

  const updated = await prisma.relationship.update({
    where: { id },
    data: {
      ...(entityAId !== undefined && { entityAId: Number(entityAId) }),
      ...(entityBId !== undefined && { entityBId: Number(entityBId) }),
      ...(relationType !== undefined && { relationType }),
      ...(bendOffset !== undefined && { bendOffset: Number(bendOffset) }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { relationshipId } = await params;
  const id = Number(relationshipId);

  const relationship = await prisma.relationship.findUnique({ where: { id }, select: { caseId: true } });
  if (!relationship) return NextResponse.json({ error: "not found" }, { status: 404 });

  const access = await requireCaseAccess(relationship.caseId, "editor");
  if (!access.ok) return access.response;

  await prisma.relationship.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
