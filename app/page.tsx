import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CaseCard } from "@/components/CaseCard";
import { CaseFormModal } from "@/components/CaseFormModal";
import { ImportCaseModal } from "@/components/ImportCaseModal";
import { LandingPage } from "@/components/landing/LandingPage";

export const dynamic = "force-dynamic";

/** One URL, two pages. A crawler never carries a session, so what gets indexed
 *  is always the landing page — which is why the root metadata in the layout
 *  describes the product. A signed-in member gets a title that names what they
 *  are actually looking at instead. */
export async function generateMetadata(): Promise<Metadata> {
  const user = await getCurrentUser();
  return user ? { title: "Your cases", robots: { index: false, follow: false } } : {};
}

export default async function HomePage() {
  const user = await getCurrentUser();
  // Not signed in: this is the public front door, not a redirect to a login form.
  if (!user) return <LandingPage />;

  const allCases = await prisma.case.findMany({
    where: {
      OR: [
        { userId: user.id },
        { shares: { some: { kind: "email", OR: [{ userId: user.id }, { invitedEmail: user.email }] } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { entities: true } },
      owner: { select: { id: true, name: true, email: true } },
      shares: { where: { kind: "email" }, select: { userId: true, invitedEmail: true, role: true } },
    },
  });

  const myCases = allCases.filter((c) => c.userId === user.id);
  const sharedCases = allCases.filter((c) => c.userId !== user.id);

  // An admin can browse (read-only) every case in the system, not just their
  // own or ones shared with them — everything already visible above is
  // excluded so nothing is listed twice.
  const otherCases =
    user.role === "admin"
      ? await prisma.case.findMany({
          where: { id: { notIn: allCases.map((c) => c.id) } },
          orderBy: { updatedAt: "desc" },
          include: {
            _count: { select: { entities: true } },
            owner: { select: { id: true, name: true, email: true } },
          },
        })
      : [];

  const activeCount = myCases.filter((c) => c.status === "active").length;
  const totalEntities = myCases.reduce((sum, c) => sum + c._count.entities, 0);

  function roleFor(c: (typeof allCases)[number]) {
    const share = c.shares.find((s) => s.userId === user!.id || s.invitedEmail === user!.email);
    return share?.role === "editor" ? "Editor" : "Viewer";
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Cases</h1>
          {myCases.length > 0 && (
            <p className="text-xs text-muted mt-1.5">
              {activeCount} active · {myCases.length} total · {totalEntities} entities
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ImportCaseModal />
          <CaseFormModal />
        </div>
      </div>

      {myCases.length === 0 ? (
        <div className="card border-dashed p-8 text-center">
          <p className="item-title">No cases yet</p>
          <p className="text-sm text-muted mt-1">
            Create a case to start tracking what you find.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCases.map((c) => (
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

      {sharedCases.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">Shared with me</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedCases.map((c) => (
              <CaseCard
                key={c.id}
                id={c.id}
                name={c.name}
                description={c.description}
                status={c.status}
                entityCount={c._count.entities}
                updatedAt={c.updatedAt.toISOString()}
                badge={`Shared · ${roleFor(c)}`}
                ownerName={c.owner.name ?? c.owner.email}
              />
            ))}
          </div>
        </section>
      )}

      {otherCases.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">All cases</h2>
          <p className="text-xs text-muted -mt-2">
            Visible to you as an admin — read-only unless the owner also shares it with you directly.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherCases.map((c) => (
              <CaseCard
                key={c.id}
                id={c.id}
                name={c.name}
                description={c.description}
                status={c.status}
                entityCount={c._count.entities}
                updatedAt={c.updatedAt.toISOString()}
                badge="Admin view"
                ownerName={c.owner.name ?? c.owner.email}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
