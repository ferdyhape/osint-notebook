import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCaseAccess } from "@/lib/case-access";

type Params = { params: Promise<{ caseId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "viewer");
  if (!access.ok) return access.response;

  const notes = await prisma.note.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      entity: { select: { id: true, type: true, value: true, label: true } },
    },
  });
  return NextResponse.json(notes);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "editor");
  if (!access.ok) return access.response;

  const body = await request.json();
  const { content, entityId } = body;

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      caseId: id,
      entityId: entityId ? Number(entityId) : null,
      content,
    },
  });
  return NextResponse.json(note, { status: 201 });
}
