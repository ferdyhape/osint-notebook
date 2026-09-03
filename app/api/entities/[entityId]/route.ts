import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeType } from "@/lib/pivot";

type Params = { params: Promise<{ entityId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { entityId } = await params;
  const entity = await prisma.entity.findUnique({
    where: { id: Number(entityId) },
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
  const body = await request.json();
  const { type, value, attributes, source } = body;

  const updated = await prisma.entity.update({
    where: { id: Number(entityId) },
    data: {
      ...(type !== undefined && { type: normalizeType(type) }),
      ...(value !== undefined && { value: value.trim() }),
      ...(attributes !== undefined && { attributes }),
      ...(source !== undefined && { source }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { entityId } = await params;
  await prisma.entity.delete({ where: { id: Number(entityId) } });
  return NextResponse.json({ ok: true });
}
