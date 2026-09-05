import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCaseAccess } from "@/lib/case-access";

type Params = { params: Promise<{ caseId: string; shareId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { caseId, shareId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "owner");
  if (!access.ok) return access.response;

  const { role } = await request.json();
  if (role !== "viewer" && role !== "editor") {
    return NextResponse.json({ error: "role must be viewer or editor" }, { status: 400 });
  }

  const updated = await prisma.caseShare.update({
    where: { id: Number(shareId), caseId: id, kind: "email" },
    data: { role },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { caseId, shareId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "owner");
  if (!access.ok) return access.response;

  await prisma.caseShare.delete({ where: { id: Number(shareId), caseId: id, kind: "email" } });
  return NextResponse.json({ ok: true });
}
