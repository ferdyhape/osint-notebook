import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const cases = await prisma.case.findMany({
    where: {
      OR: [
        { userId: user.id },
        { shares: { some: { kind: "email", OR: [{ userId: user.id }, { invitedEmail: user.email }] } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { entities: true } }, owner: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(cases);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const created = await prisma.case.create({
    data: { name, description: description ?? null, userId: user.id },
  });
  return NextResponse.json(created, { status: 201 });
}
