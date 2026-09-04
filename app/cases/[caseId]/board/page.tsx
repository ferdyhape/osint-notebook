import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCaseAccess } from "@/lib/case-access";
import { fetchCaseBoardData, computeForceLayout, entitiesToNodes, relationshipsToEdges } from "@/lib/board";
import { InvestigationBoard } from "@/components/board/InvestigationBoard";
import { CaseViewTabs } from "@/components/board/CaseViewTabs";

export const dynamic = "force-dynamic";

export default async function CaseBoardPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const id = Number(caseId);

  const user = await getCurrentUser();
  const role = user ? await getCaseAccess(id, user) : null;
  if (!role) notFound();
  const readOnly = role === "viewer";

  const [data, combinableRules] = await Promise.all([
    fetchCaseBoardData(id),
    prisma.pivotRule.findMany({ where: { combinable: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!data) notFound();

  const missingPositions = data.entities.filter((e) => e.positionX === null || e.positionY === null);
  const fallbackPositions =
    missingPositions.length > 0 ? computeForceLayout(data.entities, data.relationships) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">{data.name}</h1>
          <p className="text-sm text-muted mt-1">Investigation board</p>
        </div>
        <CaseViewTabs detailHref={`/cases/${id}`} boardHref={`/cases/${id}/board`} active="board" />
      </div>

      <InvestigationBoard
        caseId={id}
        readOnly={readOnly}
        combinableRules={combinableRules}
        initialNodes={entitiesToNodes(data.entities, fallbackPositions)}
        initialEdges={relationshipsToEdges(data.relationships)}
      />
    </div>
  );
}
