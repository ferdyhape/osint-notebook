import type { PivotRule } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildValueExpression, resolvePivotSuggestion, normalizeType, isUrlValue } from "./pivot";

function makeRule(overrides: Partial<PivotRule> = {}): PivotRule {
  return {
    id: 1,
    entityType: "email",
    title: "Search on Have I Been Pwned",
    description: "Check if this email appears in a known breach",
    actionType: "url",
    urlTemplate: "https://haveibeenpwned.com/account/{value}",
    category: "breach",
    isFree: true,
    combinable: false,
    sortOrder: 0,
    createdById: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("buildValueExpression", () => {
  it("joins multiple values with AND by default", () => {
    expect(buildValueExpression(["a", "b"])).toBe('"a" AND "b"');
  });

  it("joins multiple values with OR when requested", () => {
    expect(buildValueExpression(["a", "b"], "OR")).toBe('"a" OR "b"');
  });

  it("quotes a single value with no operator needed", () => {
    expect(buildValueExpression(["only"])).toBe('"only"');
  });
});

describe("resolvePivotSuggestion", () => {
  it("substitutes a single value into the URL template", () => {
    const result = resolvePivotSuggestion(makeRule(), "test@example.com");
    expect(result.resolvedUrl).toBe("https://haveibeenpwned.com/account/test%40example.com");
  });

  it("combines multiple values with AND when the rule is combinable", () => {
    const rule = makeRule({ combinable: true, urlTemplate: "https://example.com/search?q={value}" });
    const result = resolvePivotSuggestion(rule, ["foo", "bar"], "AND");
    expect(result.resolvedUrl).toBe(`https://example.com/search?q=${encodeURIComponent('"foo" AND "bar"')}`);
  });

  it("uses only the first value when the rule is not combinable, even if given several", () => {
    const rule = makeRule({ combinable: false, urlTemplate: "https://example.com/search?q={value}" });
    const result = resolvePivotSuggestion(rule, ["foo", "bar"]);
    expect(result.resolvedUrl).toBe("https://example.com/search?q=foo");
  });

  it("returns a null resolvedUrl when the rule has no urlTemplate", () => {
    const rule = makeRule({ urlTemplate: null, actionType: "manual" });
    const result = resolvePivotSuggestion(rule, "anything");
    expect(result.resolvedUrl).toBeNull();
  });

  it("replaces every occurrence of the placeholder, not just the first", () => {
    const rule = makeRule({ urlTemplate: "https://example.com/{value}/{value}" });
    const result = resolvePivotSuggestion(rule, "x");
    expect(result.resolvedUrl).toBe("https://example.com/x/x");
  });

  it("omits urlTemplate from the resolved suggestion's own fields", () => {
    const result = resolvePivotSuggestion(makeRule(), "test@example.com");
    expect(result).not.toHaveProperty("urlTemplate");
    expect(result.id).toBe(1);
  });
});

describe("normalizeType", () => {
  it("lowercases and trims", () => {
    expect(normalizeType("  Email  ")).toBe("email");
  });
});

describe("isUrlValue", () => {
  it("accepts http and https URLs", () => {
    expect(isUrlValue("http://example.com")).toBe(true);
    expect(isUrlValue("https://example.com")).toBe(true);
  });

  it("rejects a bare domain or non-URL text", () => {
    expect(isUrlValue("example.com")).toBe(false);
    expect(isUrlValue("not a url")).toBe(false);
  });

  it("ignores leading whitespace", () => {
    expect(isUrlValue("   https://example.com")).toBe(true);
  });
});
