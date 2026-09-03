import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeType } from "@/lib/pivot";

type Params = { params: Promise<{ caseId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const type = request.nextUrl.searchParams.get("type");

  const entities = await prisma.entity.findMany({
    where: {
      caseId: Number(caseId),
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(entities);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const body = await request.json();
  const { type, value, attributes, source, relatedToEntityId, relationType } = body;

  if (!type || typeof type !== "string") {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }
  if (!value || typeof value !== "string") {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  const entity = await prisma.entity.create({
    data: {
      caseId: Number(caseId),
      type: normalizeType(type),
      value: value.trim(),
      attributes: attributes ?? undefined,
      source: source ?? null,
    },
  });

  if (relatedToEntityId) {
    await prisma.relationship.create({
      data: {
        caseId: Number(caseId),
        entityAId: Number(relatedToEntityId),
        entityBId: entity.id,
        relationType: relationType || "found from",
      },
    });

    await prisma.note.create({
      data: {
        caseId: Number(caseId),
        entityId: entity.id,
        content: `Found by pivoting from entity #${relatedToEntityId}.`,
      },
    });
  }

  return NextResponse.json(entity, { status: 201 });
}
