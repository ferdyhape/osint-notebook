import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, startSession, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { verificationEmail } from "@/lib/mail-templates";

const VERIFY_TOKEN_HOURS = 24;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, name } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Use at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "That email is already registered" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: typeof name === "string" && name.trim() ? name.trim() : null,
      passwordHash: await hashPassword(password),
    },
  });

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      purpose: "email_verify",
      expiresAt: new Date(Date.now() + VERIFY_TOKEN_HOURS * 60 * 60 * 1000),
    },
  });
  await sendMail({ to: user.email, ...verificationEmail(token) });

  await startSession(user.id);
  return NextResponse.json({ ok: true }, { status: 201 });
}
