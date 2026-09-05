import type { PivotRule } from "@prisma/client";

export type CombineOperator = "AND" | "OR";

export type ResolvedPivotSuggestion = Omit<PivotRule, "urlTemplate"> & {
  resolvedUrl: string | null;
};

export function buildValueExpression(values: string[], operator: CombineOperator = "AND") {
  return values.map((v) => `"${v}"`).join(` ${operator} `);
}

export function resolvePivotSuggestion(
  rule: PivotRule,
  input: string | string[],
  operator: CombineOperator = "AND"
): ResolvedPivotSuggestion {
  const { urlTemplate, ...rest } = rule;
  const values = Array.isArray(input) ? input : [input];
  const query = rule.combinable ? buildValueExpression(values, operator) : values[0];

  return {
    ...rest,
    resolvedUrl: urlTemplate
      ? urlTemplate.replaceAll("{value}", encodeURIComponent(query))
      : null,
  };
}

export const ENTITY_TYPES = [
  "email",
  "username",
  "phone",
  "domain",
  "ip",
  "person",
  "organization",
  "address",
  "image",
  "other",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ANY_ENTITY_TYPE = "any";

/** Keeps user-typed types from splitting into near-duplicates ("Email" vs "email "). */
export function normalizeType(type: string) {
  return type.trim().toLowerCase();
}

/** True when a value is an absolute http(s) URL worth rendering as a real link. */
export function isUrlValue(value: string) {
  return /^https?:\/\//i.test(value.trim());
}
