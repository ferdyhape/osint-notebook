import { prisma } from "@/lib/prisma";
import { resolveShareToken } from "@/lib/share-link";
import { fetchCaseBoardData, entitiesToNodes, relationshipsToEdges, computeForceLayout } from "@/lib/board";
import { InvestigationBoard } from "@/components/board/InvestigationBoard";
import { CaseViewTabs } from "@/components/board/CaseViewTabs";
import { InvalidShareLink } from "@/components/InvalidShareLink";

export const dynamic = "force-dynamic";

export default async function SharedBoardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const caseId = await resolveShareToken(token);
  if (!caseId) return <InvalidShareLink />;

  const [data, combinableRules] = await Promise.all([
    fetchCaseBoardData(caseId),
    prisma.pivotRule.findMany({ where: { combinable: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!data) return <InvalidShareLink />;

  const missingPositions = data.entities.some((e) => e.positionX === null || e.positionY === null);
  const fallbackPositions = missingPositions
    ? computeForceLayout(data.entities, data.relationships)
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">{data.name}</h1>
          <p className="text-sm text-muted mt-1">Shared read-only · Investigation board</p>
        </div>
        <CaseViewTabs detailHref={`/share/${token}/detail`} boardHref={`/share/${token}`} active="board" />
      </div>

      <InvestigationBoard
        caseId={caseId}
        readOnly
        shareToken={token}
        combinableRules={combinableRules}
        initialNodes={entitiesToNodes(data.entities, fallbackPositions)}
        initialEdges={relationshipsToEdges(data.relationships)}
      />
    </div>
  );
}
