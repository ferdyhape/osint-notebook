import { describe, expect, it } from "vitest";
import { parseCaseImport } from "./import";

function wellFormedExport() {
  return {
    case: { name: "Operation Test", description: "A sample case", status: "active" },
    entities: [
      { type: "Email", value: "test@example.com", label: "Primary", source: "leak site" },
      { type: "domain", value: "example.com" },
    ],
    relationships: [
      { from: { type: "Email", value: "test@example.com" }, relation: "found", to: { type: "domain", value: "example.com" } },
    ],
    notes: [{ content: "An observation.", entity: { type: "email", value: "test@example.com" } }],
  };
}

describe("parseCaseImport — accepts a well-formed export", () => {
  it("parses case metadata", () => {
    const parsed = parseCaseImport(wellFormedExport());
    expect(parsed.name).toBe("Operation Test");
    expect(parsed.description).toBe("A sample case");
    expect(parsed.status).toBe("active");
  });

  it("normalizes entity types to lowercase", () => {
    const parsed = parseCaseImport(wellFormedExport());
    expect(parsed.entities[0].type).toBe("email");
  });

  it("carries entity label/source through, defaulting missing ones to null", () => {
    const parsed = parseCaseImport(wellFormedExport());
    expect(parsed.entities[0].label).toBe("Primary");
    expect(parsed.entities[1].label).toBeNull();
    expect(parsed.entities[1].source).toBeNull();
  });

  it("parses relationships with normalized from/to types", () => {
    const parsed = parseCaseImport(wellFormedExport());
    expect(parsed.relationships[0]).toEqual({
      from: { type: "email", value: "test@example.com" },
      relation: "found",
      to: { type: "domain", value: "example.com" },
    });
  });

  it("defaults a missing relation label to \"found\"", () => {
    const raw = wellFormedExport();
    delete (raw.relationships[0] as { relation?: unknown }).relation;
    const parsed = parseCaseImport(raw);
    expect(parsed.relationships[0].relation).toBe("found");
  });

  it("parses a note's attached entity, or null when it has none", () => {
    const parsed = parseCaseImport(wellFormedExport());
    expect(parsed.notes[0].entity).toEqual({ type: "email", value: "test@example.com" });
  });

  it("treats missing entities/relationships/notes arrays as empty", () => {
    const parsed = parseCaseImport({ case: { name: "Bare case" } });
    expect(parsed.entities).toEqual([]);
    expect(parsed.relationships).toEqual([]);
    expect(parsed.notes).toEqual([]);
  });

  it("treats any status other than \"closed\" as active", () => {
    const parsed = parseCaseImport({ case: { name: "X", status: "archived" } });
    expect(parsed.status).toBe("active");
  });
});

describe("parseCaseImport — rejects a malformed export", () => {
  it("rejects a non-object payload", () => {
    expect(() => parseCaseImport("just a string")).toThrow(/doesn't look like a case export/);
    expect(() => parseCaseImport(null)).toThrow(/doesn't look like a case export/);
    expect(() => parseCaseImport(42)).toThrow(/doesn't look like a case export/);
  });

  it("rejects a missing case name", () => {
    expect(() => parseCaseImport({ case: { description: "no name here" } })).toThrow(/case\.name/);
  });

  it("rejects a blank case name", () => {
    expect(() => parseCaseImport({ case: { name: "   " } })).toThrow(/case\.name/);
  });

  it("rejects an entity missing type or value", () => {
    const raw = wellFormedExport();
    raw.entities = [{ value: "no-type@example.com" } as unknown as (typeof raw.entities)[number]];
    expect(() => parseCaseImport(raw)).toThrow(/entities\[0\]/);
  });

  it("rejects a relationship missing its \"to\" side", () => {
    const raw = wellFormedExport();
    raw.relationships = [
      { from: { type: "email", value: "a@example.com" }, relation: "found" } as unknown as (typeof raw.relationships)[number],
    ];
    expect(() => parseCaseImport(raw)).toThrow(/relationships\[0\]/);
  });

  it("rejects a note missing content", () => {
    const raw = wellFormedExport();
    raw.notes = [{ entity: { type: "email", value: "a@example.com" } } as unknown as (typeof raw.notes)[number]];
    expect(() => parseCaseImport(raw)).toThrow(/notes\[0\]/);
  });

  it("rejects a non-object entry inside the entities array", () => {
    const raw = wellFormedExport();
    raw.entities = ["not an object" as unknown as (typeof raw.entities)[number]];
    expect(() => parseCaseImport(raw)).toThrow(/entities\[0\] is not an object/);
  });
});
