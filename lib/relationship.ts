/**
 * A relationship is stored as entityA --[relationType]--> entityB, and is
 * always meant to read forward, subject-verb-object: "{entityA} {relationType}
 * {entityB}". The old default, "found from", broke that: it reads backwards
 * ("B found from A" implies B is the subject), which is exactly why the board
 * arrow looked like it pointed the wrong way — the label disagreed with the
 * arrowhead. "found" alone keeps the same story pointing the same direction:
 * "A found B" — the entity you already had led you to the one you just added.
 */
export const DEFAULT_RELATION_TYPE = "found";

/** Seed vocabulary offered as datalist suggestions on every relation-type
 *  input — a starting point, not a closed set; typing anything else is fine. */
export const RELATIONSHIP_VOCAB = [
  "found",
  "mentioned",
  "referenced",
  "contains",
  "shows",
  "identifies",
  "reveals",
  "lists",
  "names",
  "links to",
  "points to",
  "leads to",
  "indicates",
  "suggests",
  "confirms",
  "supports",
  "corroborates",
  "matches",
  "derived from",
  "extracted from",
  "obtained from",
  "located in",
  "embedded in",
  "attached to",
  "associated with",
  "linked with",
] as const;

/** What to show for an entity in a relationship sentence — its label if it has
 *  one (item 3), otherwise its type. Kept separate from `value` on purpose:
 *  the sentence describes the *shape* of the link ("name found birthday
 *  date"), the value is the payload you click through to. */
export function relationSubject(entity: { type: string; label?: string | null }) {
  return entity.label?.trim() || entity.type;
}

/**
 * The one canonical description of a relationship row, built the same way
 * everywhere it's rendered (entity detail page, board panel) so "source
 * found target" always reads the same, regardless of which of the two
 * entities happens to be the page you're looking at.
 *
 * `perspective` says which side the *other* entity (the one this row should
 * link to) is on — "source" when the current entity is entityB and the
 * other one is entityA, "target" when it's the reverse. The current entity's
 * own value is never repeated (it's already the page you're on); the other
 * entity's value is always the part that's shown in full and linked.
 */
export function relationshipSentence(args: {
  currentType: string;
  currentLabel?: string | null;
  otherType: string;
  otherLabel?: string | null;
  otherValue: string;
  relationType: string;
  /** Is `other` the source (entityA) or the target/found entity (entityB) of this relationship? */
  otherIs: "source" | "target";
}) {
  const current = relationSubject({ type: args.currentType, label: args.currentLabel });
  const other = relationSubject({ type: args.otherType, label: args.otherLabel });

  if (args.otherIs === "target") {
    // current = source, other = found. "{current} {relation} {other}: {value}"
    return { prefix: `${current} ${args.relationType} `, otherText: other, suffix: "", value: args.otherValue };
  }
  // current = found, other = source. "{other}: {value} {relation} {current}"
  return { prefix: "", otherText: other, suffix: ` ${args.relationType} ${current}`, value: args.otherValue };
}
