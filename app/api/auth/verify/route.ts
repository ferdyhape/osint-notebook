import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (!token) return redirectTo("/?verify=missing");

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.purpose !== "email_verify" || record.expiresAt < new Date()) {
    return redirectTo("/?verify=invalid");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.verificationToken.delete({ where: { id: record.id } }),
  ]);

  return redirectTo("/?verified=1");
}
