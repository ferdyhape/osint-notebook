import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeType } from "@/lib/pivot";
import { requireCaseAccess } from "@/lib/case-access";

type Params = { params: Promise<{ entityId: string }> };

async function resolveCaseId(entityId: number) {
  const entity = await prisma.entity.findUnique({ where: { id: entityId }, select: { caseId: true } });
  return entity?.caseId ?? null;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { entityId } = await params;
  const id = Number(entityId);
  const caseId = await resolveCaseId(id);
  if (!caseId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const access = await requireCaseAccess(caseId, "viewer");
  if (!access.ok) return access.response;

  const entity = await prisma.entity.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      relationshipsA: { include: { entityB: true } },
      relationshipsB: { include: { entityA: true } },
    },
  });
  if (!entity) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(entity);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { entityId } = await params;
  const id = Number(entityId);
  const caseId = await resolveCaseId(id);
  if (!caseId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const access = await requireCaseAccess(caseId, "editor");
  if (!access.ok) return access.response;

  const body = await request.json();
  const { type, value, attributes, source, positionX, positionY } = body;

  const updated = await prisma.entity.update({
    where: { id },
    data: {
      ...(type !== undefined && { type: normalizeType(type) }),
      ...(value !== undefined && { value: value.trim() }),
      ...(attributes !== undefined && { attributes }),
      ...(source !== undefined && { source }),
      ...(positionX !== undefined && { positionX }),
      ...(positionY !== undefined && { positionY }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { entityId } = await params;
  const id = Number(entityId);
  const caseId = await resolveCaseId(id);
  if (!caseId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const access = await requireCaseAccess(caseId, "editor");
  if (!access.ok) return access.response;

  await prisma.entity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
