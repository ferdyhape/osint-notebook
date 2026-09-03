import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ANY_ENTITY_TYPE, ENTITY_TYPES } from "@/lib/pivot";

export async function GET() {
  const [entityTypes, ruleTypes] = await Promise.all([
    prisma.entity.findMany({ select: { type: true }, distinct: ["type"] }),
    prisma.pivotRule.findMany({ select: { entityType: true }, distinct: ["entityType"] }),
  ]);

  const merged = new Set<string>(ENTITY_TYPES);
  entityTypes.forEach((e) => merged.add(e.type));
  ruleTypes.forEach((r) => {
    if (r.entityType !== ANY_ENTITY_TYPE) merged.add(r.entityType);
  });

  return NextResponse.json([...merged].sort());
}
