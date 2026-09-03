import { prisma } from "@/lib/prisma";
import { PivotRuleFormModal } from "@/components/PivotRuleFormModal";
import { PivotRulesTable } from "@/components/PivotRulesTable";

export const dynamic = "force-dynamic";

export default async function PivotRulesPage() {
  const rules = await prisma.pivotRule.findMany({
    orderBy: [{ entityType: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="space-y-7">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Pivot Rules</h1>
          <p className="text-sm text-muted mt-1.5 max-w-md">
            The next steps suggested for each entity type.
          </p>
        </div>
        <PivotRuleFormModal />
      </div>

      <PivotRulesTable
        rules={rules.map((r) => ({
          id: r.id,
          entityType: r.entityType,
          title: r.title,
          description: r.description,
          actionType: r.actionType,
          urlTemplate: r.urlTemplate,
          category: r.category,
          combinable: r.combinable,
        }))}
      />
    </div>
  );
}
