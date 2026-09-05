import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { verificationEmail } from "@/lib/mail-templates";

const VERIFY_TOKEN_HOURS = 24;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { emailVerifiedAt: true } });
  if (record?.emailVerifiedAt) {
    return NextResponse.json({ error: "Your email is already verified" }, { status: 400 });
  }

  await prisma.verificationToken.deleteMany({ where: { userId: user.id, purpose: "email_verify" } });

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

  return NextResponse.json({ ok: true });
}
