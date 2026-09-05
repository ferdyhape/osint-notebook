import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCaseAccess } from "@/lib/case-access";
import { computeForceLayout } from "@/lib/board";

type Params = { params: Promise<{ caseId: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "editor");
  if (!access.ok) return access.response;

  const [entities, relationships] = await Promise.all([
    prisma.entity.findMany({ where: { caseId: id }, select: { id: true } }),
    prisma.relationship.findMany({ where: { caseId: id }, select: { entityAId: true, entityBId: true } }),
  ]);

  const positions = computeForceLayout(entities, relationships);

  await prisma.$transaction(
    entities.map((e) =>
      prisma.entity.update({
        where: { id: e.id },
        data: { positionX: positions[e.id].x, positionY: positions[e.id].y },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
