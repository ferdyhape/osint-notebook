import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCaseAccess, resolveCaseId } from "@/lib/case-access";

type Params = { params: Promise<{ noteId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { noteId } = await params;
  const id = Number(noteId);
  const caseId = await resolveCaseId(prisma.note, id);
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
  const caseId = await resolveCaseId(prisma.note, id);
  if (!caseId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const access = await requireCaseAccess(caseId, "editor");
  if (!access.ok) return access.response;

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
