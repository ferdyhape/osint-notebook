import Link from "next/link";

export function CaseViewTabs({ detailHref, boardHref, active }: { detailHref: string; boardHref: string; active: "detail" | "board" }) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden shrink-0">
      <Link
        href={detailHref}
        className={`text-xs font-medium px-3 py-1.5 transition-colors ${
          active === "detail" ? "bg-accent text-on-accent" : "bg-surface text-muted hover:text-text"
        }`}
      >
        Detail
      </Link>
      <Link
        href={boardHref}
        className={`text-xs font-medium px-3 py-1.5 transition-colors ${
          active === "board" ? "bg-accent text-on-accent" : "bg-surface text-muted hover:text-text"
        }`}
      >
        Board
      </Link>
    </div>
  );
}
