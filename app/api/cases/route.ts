import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cases = await prisma.case.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { entities: true } } },
  });
  return NextResponse.json(cases);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const created = await prisma.case.create({
    data: { name, description: description ?? null },
  });
  return NextResponse.json(created, { status: 201 });
}
