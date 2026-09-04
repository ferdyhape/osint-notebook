import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCaseAccess } from "@/lib/case-access";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { caseId, entityAId, entityBId, relationType } = body;

  const id = Number(caseId);
  if (!id) return NextResponse.json({ error: "caseId is required" }, { status: 400 });

  const access = await requireCaseAccess(id, "editor");
  if (!access.ok) return access.response;

  if (!entityAId || !entityBId || Number(entityAId) === Number(entityBId)) {
    return NextResponse.json({ error: "Two distinct entities are required" }, { status: 400 });
  }
  if (!relationType || typeof relationType !== "string") {
    return NextResponse.json({ error: "relationType is required" }, { status: 400 });
  }

  // Both entities must actually belong to this case.
  const count = await prisma.entity.count({
    where: { id: { in: [Number(entityAId), Number(entityBId)] }, caseId: id },
  });
  if (count !== 2) {
    return NextResponse.json({ error: "Both entities must belong to this case" }, { status: 400 });
  }

  const relationship = await prisma.relationship.create({
    data: {
      caseId: id,
      entityAId: Number(entityAId),
      entityBId: Number(entityBId),
      relationType: relationType.trim(),
    },
  });
  return NextResponse.json(relationship, { status: 201 });
}
