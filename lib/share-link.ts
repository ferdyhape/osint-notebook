import "server-only";
import { prisma } from "@/lib/prisma";

/** Resolves an anonymous share token to its caseId, or null if missing/revoked. Never touches session/user identity. */
export async function resolveShareToken(token: string): Promise<number | null> {
  const share = await prisma.caseShare.findUnique({
    where: { linkToken: token },
    select: { caseId: true, kind: true },
  });
  if (!share || share.kind !== "link") return null;
  return share.caseId;
}
