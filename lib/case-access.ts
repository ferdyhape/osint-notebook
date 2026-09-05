import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type CaseRole = "owner" | "editor" | "viewer";

const RANK: Record<CaseRole, number> = { viewer: 0, editor: 1, owner: 2 };

/** The caller's role on a case, or null if they have no access at all. */
export async function getCaseAccess(
  caseId: number,
  user: { id: number; email: string } | null
): Promise<CaseRole | null> {
  if (!user) return null;

  const found = await prisma.case.findUnique({ where: { id: caseId }, select: { userId: true } });
  if (!found) return null;
  if (found.userId === user.id) return "owner";

  const share = await prisma.caseShare.findFirst({
    where: {
      caseId,
      kind: "email",
      OR: [{ userId: user.id }, { invitedEmail: user.email }],
    },
    select: { id: true, role: true, userId: true },
  });
  if (!share) return null;

  if (!share.userId) {
    await prisma.caseShare.update({ where: { id: share.id }, data: { userId: user.id } });
  }
  return share.role as CaseRole;
}

/**
 * For Route Handlers: resolves the signed-in user and their role on `caseId`,
 * returning a ready-to-return NextResponse on any failure.
 */
export async function requireCaseAccess(caseId: number, minRole: CaseRole) {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }

  const role = await getCaseAccess(caseId, user);
  if (!role) {
    return { ok: false as const, response: NextResponse.json({ error: "not found" }, { status: 404 }) };
  }
  if (RANK[role] < RANK[minRole]) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "You don't have permission to do that" }, { status: 403 }),
    };
  }

  return { ok: true as const, role, user };
}
