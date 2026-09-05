import Link from "next/link";

type CaseCardProps = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  entityCount: number;
  updatedAt: string;
  /** e.g. "Shared · Viewer" / "Shared · Editor" — omit for cases the viewer owns. */
  badge?: string;
  ownerName?: string | null;
};

export function CaseCard({
  id,
  name,
  description,
  status,
  entityCount,
  updatedAt,
  badge,
  ownerName,
}: CaseCardProps) {
  const active = status === "active";
  return (
    <Link
      href={`/cases/${id}`}
      className="enter card block p-4 hover:border-text/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="item-title leading-snug">{name}</h3>
        <span className="flex items-center gap-1.5 shrink-0 text-xs text-muted">
          <span className={`dot ${active ? "dot-active" : "dot-closed"}`} />
          {active ? "Active" : "Closed"}
        </span>
      </div>
      {description && <p className="mt-1.5 text-sm text-muted line-clamp-2">{description}</p>}
      {badge && (
        <p className="mt-1.5 text-xs text-muted">
          <span className="badge">{badge}</span>
          {ownerName && <span className="ml-1.5">from {ownerName}</span>}
        </p>
      )}
      <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs text-muted">
        <span>
          {entityCount} {entityCount === 1 ? "entity" : "entities"}
        </span>
        <span>{new Date(updatedAt).toLocaleDateString("en-GB")}</span>
      </div>
    </Link>
  );
}
