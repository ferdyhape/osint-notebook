import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type CaseRole = "owner" | "editor" | "viewer";

const RANK: Record<CaseRole, number> = { viewer: 0, editor: 1, owner: 2 };

/** The caller's role on a case, or null if they have no access at all.
 *  An admin who has no ownership/share on the case still gets "viewer" — enough
 *  to browse it read-only, never enough to edit or delete it — so "see every
 *  user's cases" doesn't also mean "touch every user's cases". */
export async function getCaseAccess(
  caseId: number,
  user: { id: number; email: string; role?: string } | null
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
  if (!share) return user.role === "admin" ? "viewer" : null;

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

/** Shared shape of `prisma.entity`/`prisma.note`/`prisma.relationship` — the
 *  one method each of them is used through here. */
type HasCaseId = {
  findUnique: (args: { where: { id: number }; select: { caseId: true } }) => Promise<{ caseId: number } | null>;
};

/**
 * Looks up which case a row belongs to, given only its own id — the first
 * step in every entity/note/relationship route before an access check can
 * even be attempted. One implementation for the three models that need it
 * (`prisma.entity`, `prisma.note`, `prisma.relationship`) rather than a
 * near-identical private copy re-typed per route.
 */
export async function resolveCaseId(model: HasCaseId, id: number): Promise<number | null> {
  const row = await model.findUnique({ where: { id }, select: { caseId: true } });
  return row?.caseId ?? null;
}
