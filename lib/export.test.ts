import { describe, expect, it } from "vitest";
import { caseFilename, caseToJson, caseToMarkdown, type ExportCase } from "./export";

function makeCase(overrides: Partial<ExportCase> = {}): ExportCase {
  return {
    id: 1,
    name: "Operation Test",
    description: "A sample investigation.",
    status: "active",
    createdAt: new Date("2026-01-01T10:00:00Z"),
    updatedAt: new Date("2026-01-02T10:00:00Z"),
    entities: [
      {
        id: 1,
        type: "email",
        value: "test@example.com",
        label: "Primary email",
        source: "leak site",
        createdAt: new Date("2026-01-01T10:00:00Z"),
      },
    ],
    relationships: [
      {
        relationType: "found",
        entityA: { value: "test@example.com", type: "email", label: "Primary email" },
        entityB: { value: "example.com", type: "domain", label: null },
      },
    ],
    notes: [
      {
        content: "Some observation.",
        createdAt: new Date("2026-01-01T12:00:00Z"),
        entity: { value: "test@example.com", type: "email", label: "Primary email" },
      },
    ],
    ...overrides,
  };
}

describe("caseFilename", () => {
  it("slugifies the case name and appends today's date", () => {
    const filename = caseFilename("Operation Test!", "json");
    expect(filename).toMatch(/^operation-test-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("falls back to \"case\" when the name has no sluggable characters", () => {
    const filename = caseFilename("!!!", "md");
    expect(filename).toMatch(/^case-\d{4}-\d{2}-\d{2}\.md$/);
  });
});

describe("caseToJson", () => {
  it("carries the case, entities, relationships (as from/to), and notes through", () => {
    const parsed = JSON.parse(caseToJson(makeCase()));
    expect(parsed.case.name).toBe("Operation Test");
    expect(parsed.entities).toEqual([
      { type: "email", value: "test@example.com", label: "Primary email", source: "leak site", createdAt: "2026-01-01T10:00:00.000Z" },
    ]);
    expect(parsed.relationships).toEqual([
      {
        from: { type: "email", value: "test@example.com", label: "Primary email" },
        relation: "found",
        to: { type: "domain", value: "example.com", label: null },
      },
    ]);
    expect(parsed.notes[0].entity).toEqual({ type: "email", value: "test@example.com", label: "Primary email" });
  });

  it("keeps entityA as the relationship's \"from\" side and entityB as its \"to\" side", () => {
    const parsed = JSON.parse(caseToJson(makeCase()));
    expect(parsed.relationships[0].from.value).toBe("test@example.com");
    expect(parsed.relationships[0].to.value).toBe("example.com");
  });

  it("produces valid JSON ending in a newline", () => {
    const json = caseToJson(makeCase());
    expect(json.endsWith("\n")).toBe(true);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe("caseToMarkdown", () => {
  it("includes the case name as an H1 heading", () => {
    const md = caseToMarkdown(makeCase());
    expect(md).toContain("# Operation Test");
  });

  it("lists entities in a table row", () => {
    const md = caseToMarkdown(makeCase());
    expect(md).toContain("test@example.com");
    expect(md).toContain("Primary email");
  });

  it("describes a relationship in subject-relation-object order", () => {
    const md = caseToMarkdown(makeCase());
    const relationshipsSection = md.split("## Relationships")[1];
    const entityAIndex = relationshipsSection.indexOf("test@example.com");
    const entityBIndex = relationshipsSection.indexOf("example.com", entityAIndex + 1);
    expect(entityAIndex).toBeGreaterThanOrEqual(0);
    expect(entityBIndex).toBeGreaterThan(entityAIndex);
  });

  it("shows a placeholder for empty sections instead of an empty table", () => {
    const md = caseToMarkdown(makeCase({ entities: [], relationships: [], notes: [] }));
    expect(md).toContain("_None recorded._");
  });

  it("strips newlines from a cell so a multi-line value can't break the table", () => {
    const md = caseToMarkdown(
      makeCase({
        entities: [
          { id: 1, type: "other", value: "line one\nline two", label: null, source: null, createdAt: new Date("2026-01-01") },
        ],
      })
    );
    expect(md).toContain("line one line two");
    expect(md).not.toMatch(/line one\nline two/);
  });
});
