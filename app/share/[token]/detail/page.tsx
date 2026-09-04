import { prisma } from "@/lib/prisma";
import { resolveShareToken } from "@/lib/share-link";
import { fetchCaseBoardData } from "@/lib/board";
import { EntityTable } from "@/components/EntityTable";
import { NoteTimeline } from "@/components/NoteTimeline";
import { ExportMenu } from "@/components/ExportMenu";
import { CaseViewTabs } from "@/components/board/CaseViewTabs";
import { InvalidShareLink } from "@/components/InvalidShareLink";

export const dynamic = "force-dynamic";

export default async function SharedDetailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const caseId = await resolveShareToken(token);
  if (!caseId) return <InvalidShareLink />;

  const [data, combinableRules] = await Promise.all([
    fetchCaseBoardData(caseId),
    prisma.pivotRule.findMany({ where: { combinable: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!data) return <InvalidShareLink />;

  const active = data.status === "active";

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">{data.name}</h1>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <span className={`dot ${active ? "dot-active" : "dot-closed"}`} />
              {active ? "Active" : "Closed"}
            </span>
          </div>
          <p className="text-sm text-muted mt-1.5">
            Shared read-only · by {data.owner.name || data.owner.email}
          </p>
          {data.description && <p className="text-sm text-muted mt-1.5 max-w-xl">{data.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CaseViewTabs detailHref={`/share/${token}/detail`} boardHref={`/share/${token}`} active="detail" />
          <ExportMenu caseId={caseId} exportBase={`/api/share/${token}`} />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="section-title">
          Entities <span className="text-xs text-muted font-normal">{data.entities.length}</span>
        </h2>
        <EntityTable
          caseId={caseId}
          combinableRules={combinableRules}
          readOnly
          linkToDetail={false}
          entities={data.entities.map((e) => ({
            id: e.id,
            type: e.type,
            value: e.value,
            source: e.source,
            createdAt: e.createdAt.toISOString(),
          }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="section-title">
          Notes <span className="text-xs text-muted font-normal">{data.notes.length}</span>
        </h2>
        <NoteTimeline
          readOnly
          notes={data.notes.map((n) => ({
            id: n.id,
            content: n.content,
            createdAt: n.createdAt.toISOString(),
            entity: n.entity,
          }))}
        />
      </section>
    </div>
  );
}
