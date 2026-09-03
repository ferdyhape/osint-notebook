import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ caseId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const notes = await prisma.note.findMany({
    where: { caseId: Number(caseId) },
    orderBy: { createdAt: "desc" },
    include: { entity: true },
  });
  return NextResponse.json(notes);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const body = await request.json();
  const { content, entityId } = body;

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      caseId: Number(caseId),
      entityId: entityId ? Number(entityId) : null,
      content,
    },
  });
  return NextResponse.json(note, { status: 201 });
}
