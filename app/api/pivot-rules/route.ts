import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeType } from "@/lib/pivot";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Feeds the (signed-in-only) pivot rules page and every case's suggestion
  // panel — not sensitive, but there's no reason to answer an anonymous request.
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const entityType = request.nextUrl.searchParams.get("entityType");
  const rules = await prisma.pivotRule.findMany({
    where: entityType ? { entityType } : undefined,
    orderBy: [{ entityType: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json();
  const {
    entityType,
    title,
    description,
    actionType,
    urlTemplate,
    category,
    isFree,
    combinable,
    sortOrder,
  } = body;

  if (!entityType || !title || !description || !actionType || !category) {
    return NextResponse.json(
      { error: "entityType, title, description, actionType, category are required" },
      { status: 400 }
    );
  }
  if (actionType === "link" && !urlTemplate) {
    return NextResponse.json(
      { error: "urlTemplate is required when actionType is 'link'" },
      { status: 400 }
    );
  }

  const created = await prisma.pivotRule.create({
    data: {
      entityType: normalizeType(entityType),
      title,
      description,
      actionType,
      urlTemplate: urlTemplate ?? null,
      category,
      isFree: isFree ?? true,
      combinable: combinable ?? false,
      sortOrder: sortOrder ?? 0,
      // Anyone signed in may add their own rule — only a *seeded* one (no
      // creator) is locked to admins, so creating never needs a role check.
      createdById: user.id,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
