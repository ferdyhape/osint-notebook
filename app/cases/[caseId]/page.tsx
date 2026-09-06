import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { detectEntities } from "@/lib/detect";
import { getCurrentUser } from "@/lib/auth";
import { getCaseAccess } from "@/lib/case-access";
import { EntityTable } from "@/components/EntityTable";
import { NoteTimeline } from "@/components/NoteTimeline";
import { EntityFormModal } from "@/components/EntityFormModal";
import { AddNoteModalButton } from "@/components/AddNoteModalButton";
import { CaseFormModal } from "@/components/CaseFormModal";
import { DeleteCaseButton } from "@/components/DeleteCaseButton";
import { DetectedEntitiesBanner } from "@/components/DetectedEntitiesBanner";
import { ExportMenu } from "@/components/ExportMenu";
import { ShareButton } from "@/components/ShareButton";
import { CaseViewTabs } from "@/components/board/CaseViewTabs";

export const dynamic = "force-dynamic";

/** A case name *is* the investigation's subject, so it must never reach a search
 *  result — the title is here for the browser tab and the member's history only. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ caseId: string }>;
}): Promise<Metadata> {
  const { caseId } = await params;
  const found = await prisma.case.findUnique({
    where: { id: Number(caseId) },
    select: { name: true },
  });
  return {
    title: found ? found.name : "Case",
    robots: { index: false, follow: false },
  };
}


export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const id = Number(caseId);

  const user = await getCurrentUser();
  const role = user ? await getCaseAccess(id, user) : null;
  if (!role) notFound();
  const canEdit = role === "owner" || role === "editor";
  const isOwner = role === "owner";

  const [found, combinableRules] = await Promise.all([
    prisma.case.findUnique({
      where: { id },
      include: {
        entities: { orderBy: { createdAt: "desc" } },
        notes: { orderBy: { createdAt: "desc" }, include: { entity: true } },
      },
    }),
    prisma.pivotRule.findMany({ where: { combinable: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (!found) notFound();

  const active = found.status === "active";
  const existingValues = new Set(found.entities.map((e) => e.value.toLowerCase()));
  const detected = detectEntities(`${found.name} ${found.description ?? ""}`).filter(
    (d) => !existingValues.has(d.value.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <Link href="/" className="btn btn-ghost btn-sm">
            ← All cases
          </Link>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="page-title">{found.name}</h1>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <span className={`dot ${active ? "dot-active" : "dot-closed"}`} />
              {active ? "Active" : "Closed"}
            </span>
          </div>
          {found.description && (
            <p className="text-sm text-muted mt-1.5 max-w-xl">{found.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CaseViewTabs detailHref={`/cases/${id}`} boardHref={`/cases/${id}/board`} active="detail" />
          <ExportMenu caseId={id} />
          {isOwner && <ShareButton caseId={id} />}
          {isOwner && (
            <CaseFormModal
              trigger="header"
              initial={{
                id: found.id,
                name: found.name,
                description: found.description,
                status: found.status,
              }}
            />
          )}
          {isOwner && <DeleteCaseButton caseId={id} caseName={found.name} />}
        </div>
      </div>

      {canEdit && <DetectedEntitiesBanner caseId={id} detected={detected} />}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">
            Entities{" "}
            <span className="text-xs text-muted font-normal">{found.entities.length}</span>
          </h2>
          {canEdit && <EntityFormModal caseId={id} />}
        </div>
        <EntityTable
          caseId={id}
          combinableRules={combinableRules}
          readOnly={!canEdit}
          entities={found.entities.map((e) => ({
            id: e.id,
            type: e.type,
            value: e.value,
            label: e.label,
            source: e.source,
            createdAt: e.createdAt.toISOString(),
          }))}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">
            Notes{" "}
            <span className="font-data text-xs text-muted font-normal">{found.notes.length}</span>
          </h2>
          {canEdit && <AddNoteModalButton caseId={id} />}
        </div>
        <NoteTimeline
          readOnly={!canEdit}
          notes={found.notes.map((n) => ({
            id: n.id,
            content: n.content,
            createdAt: n.createdAt.toISOString(),
            entity: n.entity
              ? { id: n.entity.id, type: n.entity.type, value: n.entity.value }
              : null,
          }))}
        />
      </section>
    </div>
  );
}
