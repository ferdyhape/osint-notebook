import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ANY_ENTITY_TYPE, resolvePivotSuggestion } from "@/lib/pivot";

type Params = { params: Promise<{ entityId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { entityId } = await params;
  const entity = await prisma.entity.findUnique({ where: { id: Number(entityId) } });
  if (!entity) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const rules = await prisma.pivotRule.findMany({
    where: { entityType: { in: [entity.type, ANY_ENTITY_TYPE] } },
    orderBy: { sortOrder: "asc" },
  });

  // Type-specific steps first, generic "any" steps after.
  const ordered = rules.sort(
    (a, b) => Number(a.entityType === ANY_ENTITY_TYPE) - Number(b.entityType === ANY_ENTITY_TYPE)
  );

  const suggestions = ordered.map((rule) => resolvePivotSuggestion(rule, entity.value));
  return NextResponse.json(suggestions);
}
