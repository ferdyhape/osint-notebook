import Link from "next/link";

export function CaseViewTabs({
  detailHref,
  boardHref,
  active,
}: {
  detailHref: string;
  boardHref: string;
  active: "detail" | "board";
}) {
  return (
    <div className="seg">
      <Link href={detailHref} className="seg-btn" data-active={active === "detail"}>
        Detail
      </Link>
      <Link href={boardHref} className="seg-btn" data-active={active === "board"}>
        Board
      </Link>
    </div>
  );
}
