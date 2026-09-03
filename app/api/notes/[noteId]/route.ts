import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ noteId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { noteId } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const updated = await prisma.note.update({
    where: { id: Number(noteId) },
    data: { content: content.trim() },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { noteId } = await params;
  await prisma.note.delete({ where: { id: Number(noteId) } });
  return NextResponse.json({ ok: true });
}
