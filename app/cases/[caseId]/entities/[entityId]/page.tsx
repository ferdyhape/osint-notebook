import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCaseAccess } from "@/lib/case-access";
import { NoteTimeline } from "@/components/notes/NoteTimeline";
import { AddNoteModalButton } from "@/components/notes/AddNoteModalButton";
import { PivotSuggestionsPanel } from "@/components/pivot/PivotSuggestionsPanel";
import { EntityFormModal } from "@/components/entities/EntityFormModal";
import { DeleteEntityButton } from "@/components/entities/DeleteEntityButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { RelatedEntitiesList, type RelatedRow } from "@/components/relationships/RelatedEntitiesList";
import { isUrlValue } from "@/lib/pivot";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ caseId: string; entityId: string }>;
}): Promise<Metadata> {
  const { entityId } = await params;
  const found = await prisma.entity.findUnique({
    where: { id: Number(entityId) },
    select: { value: true, type: true },
  });
  return {
    title: found ? `${found.value} · ${found.type}` : "Entity",
    robots: { index: false, follow: false },
  };
}


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

  const related: RelatedRow[] = [
    ...entity.relationshipsA.map((r) => ({
      relationshipId: r.id,
      relationType: r.relationType,
      otherIs: "target" as const,
      other: { id: r.entityB.id, type: r.entityB.type, value: r.entityB.value, label: r.entityB.label },
    })),
    ...entity.relationshipsB.map((r) => ({
      relationshipId: r.id,
      relationType: r.relationType,
      otherIs: "source" as const,
      other: { id: r.entityA.id, type: r.entityA.type, value: r.entityA.value, label: r.entityA.label },
    })),
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

          {entity.label && <p className="text-sm font-medium text-muted mt-2">{entity.label}</p>}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <h1 className="text-xl font-medium break-all">
              {isUrlValue(entity.value) ? (
                <a
                  href={entity.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-data hover:text-accent hover:underline"
                >
                  {entity.value}
                </a>
              ) : (
                <span className="font-data">{entity.value}</span>
              )}
            </h1>
            {/* Beside the value, not inside the actions row — so it never
             *  competes with "what does Copy even copy here?" (there's only
             *  one thing to copy: the value right next to it). */}
            <CopyButton value={entity.value} className="btn btn-row" label="Copy value" />
            <span className="badge" title={entity.type}>
              {entity.type}
            </span>
          </div>
          {entity.source && (
            <p className="text-sm text-muted mt-1 break-words" title={entity.source}>
              Source: {entity.source}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {canEdit && (
            <>
              <EntityFormModal
                caseId={caseIdNum}
                placement="header"
                initial={{
                  id: entity.id,
                  type: entity.type,
                  value: entity.value,
                  label: entity.label,
                  source: entity.source,
                }}
              />
              <DeleteEntityButton
                entityId={entity.id}
                entityValue={entity.value}
                placement="header"
                redirectTo={`/cases/${caseIdNum}`}
              />
            </>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h2 className="section-title">Suggested next steps</h2>
          <PivotSuggestionsPanel
            caseId={caseIdNum}
            entityId={entityIdNum}
            entityType={entity.type}
            entityLabel={entity.label}
          />
        </div>

        <div className="space-y-8">
          <RelatedEntitiesList
            caseId={caseIdNum}
            current={{ id: entity.id, type: entity.type, value: entity.value, label: entity.label }}
            related={related}
            readOnly={!canEdit}
          />

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
