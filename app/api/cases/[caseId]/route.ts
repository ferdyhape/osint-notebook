import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ caseId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const found = await prisma.case.findUnique({
    where: { id: Number(caseId) },
    include: {
      entities: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
      relationships: true,
    },
  });
  if (!found) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(found);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const body = await request.json();
  const { name, description, status } = body;

  const updated = await prisma.case.update({
    where: { id: Number(caseId) },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  await prisma.case.delete({ where: { id: Number(caseId) } });
  return NextResponse.json({ ok: true });
}
