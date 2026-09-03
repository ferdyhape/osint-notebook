import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { name, email } = await request.json();

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const nextEmail = email.trim().toLowerCase();
  const taken = await prisma.user.findFirst({
    where: { email: nextEmail, id: { not: user.id } },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { email: nextEmail, name: typeof name === "string" && name.trim() ? name.trim() : null },
    select: { id: true, email: true, name: true },
  });
  return NextResponse.json(updated);
}
