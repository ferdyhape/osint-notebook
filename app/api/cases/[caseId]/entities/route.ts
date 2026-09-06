import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeType } from "@/lib/pivot";
import { DEFAULT_RELATION_TYPE } from "@/lib/relationship";
import { requireCaseAccess } from "@/lib/case-access";

type Params = { params: Promise<{ caseId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "viewer");
  if (!access.ok) return access.response;

  const type = request.nextUrl.searchParams.get("type");

  const entities = await prisma.entity.findMany({
    where: {
      caseId: id,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(entities);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "editor");
  if (!access.ok) return access.response;

  const body = await request.json();
  const { type, value, label, attributes, source, relatedToEntityId, relationType } = body;

  if (!type || typeof type !== "string") {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }
  if (!value || typeof value !== "string") {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  const entity = await prisma.$transaction(async (tx) => {
    const created = await tx.entity.create({
      data: {
        caseId: id,
        type: normalizeType(type),
        value: value.trim(),
        label: typeof label === "string" && label.trim() ? label.trim() : null,
        attributes: attributes ?? undefined,
        source: source ?? null,
      },
    });

    if (relatedToEntityId) {
      await tx.relationship.create({
        data: {
          caseId: id,
          entityAId: Number(relatedToEntityId),
          entityBId: created.id,
          relationType: relationType || DEFAULT_RELATION_TYPE,
        },
      });

      const source = await tx.entity.findUnique({
        where: { id: Number(relatedToEntityId) },
        select: { type: true, value: true },
      });

      await tx.note.create({
        data: {
          caseId: id,
          entityId: created.id,
          content: source
            ? `Found by pivoting from "${source.value}" (${source.type}).`
            : "Found by pivoting from a related entity.",
        },
      });
    }

    return created;
  });

  return NextResponse.json(entity, { status: 201 });
}
