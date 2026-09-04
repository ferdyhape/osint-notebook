import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCaseAccess } from "@/lib/case-access";

type Params = { params: Promise<{ relationshipId: string }> };

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
