import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveShareToken } from "@/lib/share-link";
import { ANY_ENTITY_TYPE, resolvePivotSuggestion } from "@/lib/pivot";

type Params = { params: Promise<{ token: string; entityId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { token, entityId } = await params;
  const caseId = await resolveShareToken(token);
  if (!caseId) return NextResponse.json({ error: "This link is no longer valid" }, { status: 404 });

  const entity = await prisma.entity.findUnique({ where: { id: Number(entityId) } });
  if (!entity || entity.caseId !== caseId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const rules = await prisma.pivotRule.findMany({
    where: { entityType: { in: [entity.type, ANY_ENTITY_TYPE] } },
    orderBy: { sortOrder: "asc" },
  });
  const ordered = rules.sort(
    (a, b) => Number(a.entityType === ANY_ENTITY_TYPE) - Number(b.entityType === ANY_ENTITY_TYPE)
  );
  const suggestions = ordered.map((rule) => resolvePivotSuggestion(rule, entity.value));
  return NextResponse.json(suggestions);
}
