import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeType } from "@/lib/pivot";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const {
    entityType,
    title,
    description,
    actionType,
    urlTemplate,
    category,
    isFree,
    combinable,
    sortOrder,
  } = body;

  const updated = await prisma.pivotRule.update({
    where: { id: Number(id) },
    data: {
      ...(entityType !== undefined && { entityType: normalizeType(entityType) }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(actionType !== undefined && { actionType }),
      ...(urlTemplate !== undefined && { urlTemplate }),
      ...(category !== undefined && { category }),
      ...(isFree !== undefined && { isFree }),
      ...(combinable !== undefined && { combinable }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.pivotRule.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
