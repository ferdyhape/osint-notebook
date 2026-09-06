import Link from "next/link";
import { relationSubject, clip } from "@/lib/relationship";
import type { EntityOption } from "@/components/AddRelationshipModal";

const TYPE_LIMIT = 16;
const VALUE_LIMIT = 22;

function Segment({
  caseId,
  entity,
  isCurrent,
}: {
  caseId: number;
  entity: EntityOption;
  isCurrent: boolean;
}) {
  const subject = relationSubject(entity);
  const full = `${subject}: ${entity.value}`;
  const clipped = (
    <>
      {clip(subject, TYPE_LIMIT)}: {clip(entity.value, VALUE_LIMIT)}
    </>
  );

  // The current entity (this is already its own page/panel) is plain text —
  // there's nowhere useful to click to. The other one is always the link.
  if (isCurrent) {
    return (
      <span className="text-muted" title={full}>
        {clipped}
      </span>
    );
  }
  return (
    <Link
      href={`/cases/${caseId}/entities/${entity.id}`}
      className="font-medium hover:text-accent"
      title={full}
    >
      {clipped}
    </Link>
  );
}

/**
 * One relationship, always read the same way regardless of which of its two
 * entities happens to be the page you're on: "from {source} {relation}
 * {target}". Each entity's type and value are clipped independently — a long
 * value on either side (a long URL, say) only eats its own segment, not the
 * relation or the entity beside it.
 */
export function RelationshipRow({
  caseId,
  relationType,
  otherIs,
  current,
  other,
}: {
  caseId: number;
  relationType: string;
  /** Is `other` the source (entityA) or the target/found entity (entityB)? */
  otherIs: "source" | "target";
  current: EntityOption;
  other: EntityOption;
}) {
  const source = otherIs === "target" ? current : other;
  const target = otherIs === "target" ? other : current;

  return (
    <span className="min-w-0">
      <span className="text-muted">from </span>
      <Segment caseId={caseId} entity={source} isCurrent={source === current} />
      <span className="text-muted"> {relationType} </span>
      <Segment caseId={caseId} entity={target} isCurrent={target === current} />
    </span>
  );
}
