import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCaseAccess } from "@/lib/case-access";

type Params = { params: Promise<{ noteId: string }> };

async function resolveCaseId(noteId: number) {
  const note = await prisma.note.findUnique({ where: { id: noteId }, select: { caseId: true } });
  return note?.caseId ?? null;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { noteId } = await params;
  const id = Number(noteId);
  const caseId = await resolveCaseId(id);
  if (!caseId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const access = await requireCaseAccess(caseId, "editor");
  if (!access.ok) return access.response;

  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const updated = await prisma.note.update({
    where: { id },
    data: { content: content.trim() },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { noteId } = await params;
  const id = Number(noteId);
  const caseId = await resolveCaseId(id);
  if (!caseId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const access = await requireCaseAccess(caseId, "editor");
  if (!access.ok) return access.response;

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
