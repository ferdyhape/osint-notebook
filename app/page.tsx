import { prisma } from "@/lib/prisma";
import { CaseCard } from "@/components/CaseCard";
import { CaseFormModal } from "@/components/CaseFormModal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cases = await prisma.case.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { entities: true } } },
  });

  const activeCount = cases.filter((c) => c.status === "active").length;
  const totalEntities = cases.reduce((sum, c) => sum + c._count.entities, 0);

  return (
    <div className="space-y-7">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Cases</h1>
          {cases.length > 0 && (
            <p className="font-data text-xs text-muted mt-1.5">
              {activeCount} active · {cases.length} total · {totalEntities} entities
            </p>
          )}
        </div>
        <CaseFormModal />
      </div>

      {cases.length === 0 ? (
        <div className="card border-dashed p-10 text-center">
          <p className="item-title">No cases yet</p>
          <p className="text-sm text-muted mt-1">
            Create a case to start tracking what you find.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c) => (
            <CaseCard
              key={c.id}
              id={c.id}
              name={c.name}
              description={c.description}
              status={c.status}
              entityCount={c._count.entities}
              updatedAt={c.updatedAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
