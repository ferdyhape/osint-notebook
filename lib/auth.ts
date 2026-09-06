import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSessionToken, readSessionToken, SESSION_DAYS_SECONDS } from "@/lib/session-token";

export const SESSION_COOKIE = "osint_session";
export const MIN_PASSWORD_LENGTH = 8;

export { createSessionToken, readSessionToken };

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function startSession(userId: number) {
  const token = await createSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS_SECONDS,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** The signed-in user, or null. Safe to call from any server component or route. */
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = await readSessionToken(token);
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerifiedAt: true, role: true },
  });
}

/** Same, but throws instead of returning null — for routes that must be signed in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  return user;
}
