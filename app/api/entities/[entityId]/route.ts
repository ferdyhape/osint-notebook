import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeType } from "@/lib/pivot";
import { requireCaseAccess, resolveCaseId } from "@/lib/case-access";

type Params = { params: Promise<{ entityId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { entityId } = await params;
  const id = Number(entityId);
  const caseId = await resolveCaseId(prisma.entity, id);
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
  const caseId = await resolveCaseId(prisma.entity, id);
  if (!caseId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const access = await requireCaseAccess(caseId, "editor");
  if (!access.ok) return access.response;

  const body = await request.json();
  const { type, value, label, attributes, source, positionX, positionY } = body;

  const updated = await prisma.entity.update({
    where: { id },
    data: {
      ...(type !== undefined && { type: normalizeType(type) }),
      ...(value !== undefined && { value: value.trim() }),
      ...(label !== undefined && { label: typeof label === "string" && label.trim() ? label.trim() : null }),
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
  const caseId = await resolveCaseId(prisma.entity, id);
  if (!caseId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const access = await requireCaseAccess(caseId, "editor");
  if (!access.ok) return access.response;

  await prisma.entity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
