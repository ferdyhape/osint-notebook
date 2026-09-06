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

/** End-truncates a string for a one-line sentence, with the full text still
 *  reachable via a `title` attribute at the call site. Without this, a single
 *  long value (a long URL, say) swallows the rest of the sentence — the
 *  relation and the other entity — rather than just clipping its own segment. */
export function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
