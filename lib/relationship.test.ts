import { describe, expect, it } from "vitest";
import { clip, relationSubject, DEFAULT_RELATION_TYPE, RELATIONSHIP_VOCAB } from "./relationship";

describe("clip", () => {
  it("returns the text unchanged when it fits within max", () => {
    expect(clip("hello", 5)).toBe("hello");
  });

  it("returns the text unchanged when it's shorter than max", () => {
    expect(clip("hi", 5)).toBe("hi");
  });

  it("truncates and appends an ellipsis when longer than max", () => {
    expect(clip("hello world", 8)).toBe("hello w…");
  });

  it("trims trailing whitespace left by the cut before adding the ellipsis", () => {
    expect(clip("hello   world", 8)).toBe("hello…");
  });

  it("produces a string no longer than max", () => {
    const result = clip("a very long value that needs clipping", 10);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});

describe("relationSubject", () => {
  it("prefers the label when present", () => {
    expect(relationSubject({ type: "email", label: "Work email" })).toBe("Work email");
  });

  it("falls back to type when label is null", () => {
    expect(relationSubject({ type: "email", label: null })).toBe("email");
  });

  it("falls back to type when label is undefined", () => {
    expect(relationSubject({ type: "domain" })).toBe("domain");
  });

  it("falls back to type when label is empty or whitespace-only", () => {
    expect(relationSubject({ type: "ip", label: "   " })).toBe("ip");
    expect(relationSubject({ type: "ip", label: "" })).toBe("ip");
  });

  it("trims a label with surrounding whitespace", () => {
    expect(relationSubject({ type: "email", label: "  Personal  " })).toBe("Personal");
  });
});

describe("DEFAULT_RELATION_TYPE / RELATIONSHIP_VOCAB", () => {
  it("defaults to \"found\"", () => {
    expect(DEFAULT_RELATION_TYPE).toBe("found");
  });

  it("includes the default among the offered vocabulary", () => {
    expect(RELATIONSHIP_VOCAB).toContain(DEFAULT_RELATION_TYPE);
  });
});
