import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ANY_ENTITY_TYPE, resolvePivotSuggestion } from "@/lib/pivot";
import { requireCaseAccess } from "@/lib/case-access";

type Params = { params: Promise<{ entityId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { entityId } = await params;
  const entity = await prisma.entity.findUnique({ where: { id: Number(entityId) } });
  if (!entity) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const access = await requireCaseAccess(entity.caseId, "viewer");
  if (!access.ok) return access.response;

  const rules = await prisma.pivotRule.findMany({
    where: { entityType: { in: [entity.type, ANY_ENTITY_TYPE] } },
    orderBy: { sortOrder: "asc" },
  });

  // Type-specific steps before generic "any" ones — and, within each of those
  // two groups, a rule someone added themselves before the built-in ones: the
  // whole point of adding your own is that it's the step you actually want to
  // see, not one buried under the defaults.
  const ordered = rules.sort((a, b) => {
    const groupA = a.entityType === ANY_ENTITY_TYPE ? 1 : 0;
    const groupB = b.entityType === ANY_ENTITY_TYPE ? 1 : 0;
    if (groupA !== groupB) return groupA - groupB;

    const seededA = a.createdById === null ? 1 : 0;
    const seededB = b.createdById === null ? 1 : 0;
    if (seededA !== seededB) return seededA - seededB;

    return a.sortOrder - b.sortOrder;
  });

  const suggestions = ordered.map((rule) => resolvePivotSuggestion(rule, entity.value));
  return NextResponse.json(suggestions);
}
