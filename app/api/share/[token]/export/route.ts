import { NextRequest, NextResponse } from "next/server";
import { resolveShareToken } from "@/lib/share-link";
import { caseFilename, caseToJson, caseToMarkdown, getCaseExportData } from "@/lib/export";

type Params = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { token } = await params;
  const caseId = await resolveShareToken(token);
  if (!caseId) return NextResponse.json({ error: "This link is no longer valid" }, { status: 404 });

  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "markdown";
  const found = await getCaseExportData(caseId);
  if (!found) return NextResponse.json({ error: "This link is no longer valid" }, { status: 404 });

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
