import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCaseAccess } from "@/lib/case-access";

type Params = { params: Promise<{ caseId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "viewer");
  if (!access.ok) return access.response;

  const found = await prisma.case.findUnique({
    where: { id },
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
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "editor");
  if (!access.ok) return access.response;

  const body = await request.json();
  const { name, description, status } = body;

  const updated = await prisma.case.update({
    where: { id },
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
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "owner");
  if (!access.ok) return access.response;

  await prisma.case.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
