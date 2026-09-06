import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/mail";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  // Built from APP_URL, not `request.url` — behind the aaPanel reverse proxy
  // the Host Next.js actually sees on the internal 127.0.0.1:3000 connection
  // isn't reliably the public domain, so a redirect built from the request
  // itself came out as http://localhost:3000 in production.
  const redirectTo = (path: string) => NextResponse.redirect(appUrl(path));

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
