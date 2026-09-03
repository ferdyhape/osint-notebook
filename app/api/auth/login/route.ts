import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startSession, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  // Same message either way, so this cannot be used to find out which emails exist.
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    return NextResponse.json({ error: "Email or password is incorrect" }, { status: 401 });
  }

  await startSession(user.id);
  return NextResponse.json({ ok: true });
}
