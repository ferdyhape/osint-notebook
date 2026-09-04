import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCaseAccess } from "@/lib/case-access";

type Params = { params: Promise<{ caseId: string }> };

async function findLinkShare(caseId: number) {
  return prisma.caseShare.findFirst({ where: { caseId, kind: "link" } });
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "owner");
  if (!access.ok) return access.response;

  const link = await findLinkShare(id);
  return NextResponse.json(link);
}

/** Creates the case's link share if none exists yet, or regenerates its token. */
export async function POST(_request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "owner");
  if (!access.ok) return access.response;

  const token = crypto.randomBytes(32).toString("base64url");
  const existing = await findLinkShare(id);

  const link = existing
    ? await prisma.caseShare.update({ where: { id: existing.id }, data: { linkToken: token } })
    : await prisma.caseShare.create({
        data: { caseId: id, kind: "link", role: "viewer", linkToken: token, createdById: access.user.id },
      });

  return NextResponse.json(link);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "owner");
  if (!access.ok) return access.response;

  const existing = await findLinkShare(id);
  if (existing) await prisma.caseShare.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
