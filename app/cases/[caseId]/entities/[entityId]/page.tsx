import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCaseAccess } from "@/lib/case-access";
import { NoteTimeline } from "@/components/NoteTimeline";
import { AddNoteModalButton } from "@/components/AddNoteModalButton";
import { PivotSuggestionsPanel } from "@/components/PivotSuggestionsPanel";
import { EntityFormModal } from "@/components/EntityFormModal";
import { DeleteEntityButton } from "@/components/DeleteEntityButton";

export const dynamic = "force-dynamic";

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ caseId: string; entityId: string }>;
}) {
  const { caseId, entityId } = await params;
  const caseIdNum = Number(caseId);
  const entityIdNum = Number(entityId);

  const user = await getCurrentUser();
  const role = user ? await getCaseAccess(caseIdNum, user) : null;
  if (!role) notFound();
  const canEdit = role === "owner" || role === "editor";

  const entity = await prisma.entity.findUnique({
    where: { id: entityIdNum },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      relationshipsA: { include: { entityB: true } },
      relationshipsB: { include: { entityA: true } },
    },
  });

  if (!entity || entity.caseId !== caseIdNum) notFound();

  const foundVia = entity.relationshipsB.map((r) => r.entityA);

  const related = [
    ...entity.relationshipsA.map((r) => ({ relationType: r.relationType, other: r.entityB })),
    ...entity.relationshipsB.map((r) => ({ relationType: r.relationType, other: r.entityA })),
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <Link href={`/cases/${caseIdNum}`} className="btn btn-ghost btn-sm">
            ← Back to case
          </Link>

          {foundVia.length > 0 && (
            <div className="trail mt-3">
              {foundVia.map((parent) => (
                <Link
                  key={parent.id}
                  href={`/cases/${caseIdNum}/entities/${parent.id}`}
                  className="trail-chip"
                >
                  {parent.value}
                </Link>
              ))}
              <span className="text-muted">→</span>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="font-data text-xl font-medium break-all">{entity.value}</h1>
            <span className="badge">{entity.type}</span>
          </div>
          {entity.source && <p className="text-sm text-muted mt-1">Source: {entity.source}</p>}
        </div>

        {canEdit && (
          <div className="flex items-center gap-1 shrink-0">
            <EntityFormModal
              caseId={caseIdNum}
              placement="header"
              initial={{
                id: entity.id,
                type: entity.type,
                value: entity.value,
                source: entity.source,
              }}
            />
            <DeleteEntityButton
              entityId={entity.id}
              entityValue={entity.value}
              placement="header"
              redirectTo={`/cases/${caseIdNum}`}
            />
          </div>
        )}
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h2 className="section-title">Suggested next steps</h2>
          <PivotSuggestionsPanel caseId={caseIdNum} entityId={entityIdNum} />
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="section-title">Related entities</h2>
            {related.length === 0 ? (
              <div className="card border-dashed p-8 text-center">
                <p className="text-sm text-muted">Nothing linked to this yet.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {related.map((r, i) => (
                  <li key={i} className="card p-3.5 text-sm flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-muted">{r.relationType}: </span>
                      <Link
                        href={`/cases/${caseIdNum}/entities/${r.other.id}`}
                        className="font-data font-medium hover:text-accent"
                      >
                        {r.other.value}
                      </Link>
                    </div>
                    <span className="badge shrink-0">{r.other.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title">Notes</h2>
              {canEdit && <AddNoteModalButton caseId={caseIdNum} entityId={entityIdNum} />}
            </div>
            <NoteTimeline
              readOnly={!canEdit}
              notes={entity.notes.map((n) => ({
                id: n.id,
                content: n.content,
                createdAt: n.createdAt.toISOString(),
              }))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
