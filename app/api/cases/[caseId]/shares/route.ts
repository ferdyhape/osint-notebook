import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCaseAccess } from "@/lib/case-access";
import { sendMail } from "@/lib/mail";
import { shareInviteEmail } from "@/lib/mail-templates";

type Params = { params: Promise<{ caseId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "owner");
  if (!access.ok) return access.response;

  const shares = await prisma.caseShare.findMany({
    where: { caseId: id, kind: "email" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(shares);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "owner");
  if (!access.ok) return access.response;

  const body = await request.json();
  const { email, role } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = role === "editor" ? "editor" : "viewer";

  if (normalizedEmail === access.user.email) {
    return NextResponse.json({ error: "You already own this case" }, { status: 400 });
  }

  const caseRow = await prisma.case.findUnique({ where: { id }, select: { name: true } });
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  const share = await prisma.caseShare.upsert({
    where: { caseId_invitedEmail: { caseId: id, invitedEmail: normalizedEmail } },
    create: {
      caseId: id,
      kind: "email",
      role: normalizedRole,
      invitedEmail: normalizedEmail,
      userId: existingUser?.id ?? null,
      createdById: access.user.id,
    },
    update: { role: normalizedRole },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await sendMail({
    to: normalizedEmail,
    ...shareInviteEmail({
      caseName: caseRow?.name ?? "a case",
      inviterName: access.user.name || access.user.email,
      role: normalizedRole,
    }),
  });

  return NextResponse.json(share, { status: 201 });
}
