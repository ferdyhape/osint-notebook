import { NextRequest, NextResponse } from "next/server";
import { caseFilename, caseToJson, caseToMarkdown, getCaseExportData } from "@/lib/export";
import { requireCaseAccess } from "@/lib/case-access";

type Params = { params: Promise<{ caseId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { caseId } = await params;
  const id = Number(caseId);
  const access = await requireCaseAccess(id, "viewer");
  if (!access.ok) return access.response;

  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "markdown";

  const found = await getCaseExportData(id);

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
