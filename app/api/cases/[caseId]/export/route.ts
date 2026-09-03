import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { caseFilename, caseToJson, caseToMarkdown } from "@/lib/export";

type Params = { params: Promise<{ caseId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "markdown";

  const found = await prisma.case.findUnique({
    where: { id: Number(caseId) },
    include: {
      entities: { orderBy: { createdAt: "asc" } },
      relationships: {
        orderBy: { createdAt: "asc" },
        include: {
          entityA: { select: { value: true, type: true } },
          entityB: { select: { value: true, type: true } },
        },
      },
      notes: {
        orderBy: { createdAt: "asc" },
        include: { entity: { select: { value: true, type: true } } },
      },
    },
  });

  if (!found) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = format === "json" ? caseToJson(found) : caseToMarkdown(found);
  const extension = format === "json" ? "json" : "md";
  const type = format === "json" ? "application/json" : "text/markdown";

  return new NextResponse(body, {
    headers: {
      "Content-Type": `${type}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${caseFilename(found.name, extension)}"`,
    },
  });
}
