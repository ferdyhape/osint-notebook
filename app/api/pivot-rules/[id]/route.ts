import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeType } from "@/lib/pivot";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/** A seeded rule (no creator) may only be touched by an admin — that's the
 *  library everyone shares. A user-added rule may be touched by whoever
 *  added it, or by an admin. */
async function requireManage(id: number) {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }
  const rule = await prisma.pivotRule.findUnique({ where: { id }, select: { createdById: true } });
  if (!rule) {
    return { ok: false as const, response: NextResponse.json({ error: "not found" }, { status: 404 }) };
  }
  const isSeeded = rule.createdById === null;
  const allowed = user.role === "admin" || (!isSeeded && rule.createdById === user.id);
  if (!allowed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: isSeeded
            ? "Only an admin can change or delete a built-in rule"
            : "Only the person who added this rule (or an admin) can change or delete it",
        },
        { status: 403 }
      ),
    };
  }
  return { ok: true as const };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const numericId = Number(id);
  const access = await requireManage(numericId);
  if (!access.ok) return access.response;

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

  const updated = await prisma.pivotRule.update({
    where: { id: numericId },
    data: {
      ...(entityType !== undefined && { entityType: normalizeType(entityType) }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(actionType !== undefined && { actionType }),
      ...(urlTemplate !== undefined && { urlTemplate }),
      ...(category !== undefined && { category }),
      ...(isFree !== undefined && { isFree }),
      ...(combinable !== undefined && { combinable }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const numericId = Number(id);
  const access = await requireManage(numericId);
  if (!access.ok) return access.response;

  await prisma.pivotRule.delete({ where: { id: numericId } });
  return NextResponse.json({ ok: true });
}
