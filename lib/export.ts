import "server-only";
import { prisma } from "@/lib/prisma";

/** The one query both the authenticated export route and the public share export route use. */
export async function getCaseExportData(caseId: number): Promise<ExportCase | null> {
  return prisma.case.findUnique({
    where: { id: caseId },
    include: {
      entities: { orderBy: { createdAt: "asc" } },
      relationships: {
        orderBy: { createdAt: "asc" },
        include: {
          entityA: { select: { value: true, type: true, label: true } },
          entityB: { select: { value: true, type: true, label: true } },
        },
      },
      notes: {
        orderBy: { createdAt: "asc" },
        include: { entity: { select: { value: true, type: true, label: true } } },
      },
    },
  });
}

/** Shapes the export needs — a subset of the Prisma rows, so this file stays pure. */
export type ExportEntity = {
  id: number;
  type: string;
  value: string;
  label: string | null;
  source: string | null;
  createdAt: Date;
};

export type ExportRelationship = {
  relationType: string;
  entityA: { value: string; type: string; label: string | null };
  entityB: { value: string; type: string; label: string | null };
};

export type ExportNote = {
  content: string;
  createdAt: Date;
  entity: { value: string; type: string; label: string | null } | null;
};

export type ExportCase = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  entities: ExportEntity[];
  relationships: ExportRelationship[];
  notes: ExportNote[];
};

function stamp(date: Date) {
  return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function day(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Keeps a value from breaking out of its table cell. */
function cell(value: string) {
  return value.replace(/\|/g, "\|").replace(/\r?\n/g, " ").trim();
}

export function caseFilename(name: string, extension: string) {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "case";
  return `${slug}-${day(new Date())}.${extension}`;
}

export function caseToMarkdown(data: ExportCase) {
  const lines: string[] = [];

  lines.push(`# ${data.name}`, "");
  lines.push(`- **Status:** ${data.status === "active" ? "Active" : "Closed"}`);
  lines.push(`- **Opened:** ${stamp(data.createdAt)}`);
  lines.push(`- **Last change:** ${stamp(data.updatedAt)}`);
  lines.push(`- **Exported:** ${stamp(new Date())}`);
  lines.push("");

  if (data.description) {
    lines.push(data.description.trim(), "");
  }

  lines.push(`## Entities (${data.entities.length})`, "");
  if (data.entities.length === 0) {
    lines.push("_None recorded._", "");
  } else {
    lines.push("| Type | Label | Value | Source | Added |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const e of data.entities) {
      lines.push(
        `| ${cell(e.type)} | ${cell(e.label ?? "—")} | \`${cell(e.value)}\` | ${cell(e.source ?? "—")} | ${day(e.createdAt)} |`
      );
    }
    lines.push("");
  }

  // "{entityA} ({type}) — relation → {entityB} ({type})" reads forward,
  // subject-verb-object, the same direction the arrow on the board points —
  // the type on both ends is what a bare value-to-value line was missing,
  // and is what made this section unclear.
  lines.push(`## Relationships (${data.relationships.length})`, "");
  if (data.relationships.length === 0) {
    lines.push("_None recorded._", "");
  } else {
    for (const r of data.relationships) {
      const a = r.entityA.label ? `${cell(r.entityA.label)} (${cell(r.entityA.type)})` : cell(r.entityA.type);
      const b = r.entityB.label ? `${cell(r.entityB.label)} (${cell(r.entityB.type)})` : cell(r.entityB.type);
      lines.push(
        `- \`${cell(r.entityA.value)}\` _(${a})_ — **${cell(r.relationType)}** → \`${cell(r.entityB.value)}\` _(${b})_`
      );
    }
    lines.push("");
  }

  lines.push(`## Notes (${data.notes.length})`, "");
  if (data.notes.length === 0) {
    lines.push("_None recorded._", "");
  } else {
    for (const n of data.notes) {
      const entityLabel = n.entity?.label ? ` "${cell(n.entity.label)}"` : "";
      const attached = n.entity ? ` · on \`${cell(n.entity.value)}\`${entityLabel} (${cell(n.entity.type)})` : "";
      lines.push(`### ${stamp(n.createdAt)}${attached}`, "");
      lines.push(n.content.trim(), "");
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

export function caseToJson(data: ExportCase) {
  return (
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        case: {
          name: data.name,
          description: data.description,
          status: data.status,
          createdAt: data.createdAt.toISOString(),
          updatedAt: data.updatedAt.toISOString(),
        },
        entities: data.entities.map((e) => ({
          type: e.type,
          value: e.value,
          label: e.label,
          source: e.source,
          createdAt: e.createdAt.toISOString(),
        })),
        // "from" is always the relationship's source (entityA), "to" its
        // target/found entity (entityB) — the same forward direction the
        // sentence "{from} {relation} {to}" and the board's arrow both read.
        relationships: data.relationships.map((r) => ({
          from: { type: r.entityA.type, value: r.entityA.value, label: r.entityA.label },
          relation: r.relationType,
          to: { type: r.entityB.type, value: r.entityB.value, label: r.entityB.label },
        })),
        notes: data.notes.map((n) => ({
          content: n.content,
          createdAt: n.createdAt.toISOString(),
          entity: n.entity ? { type: n.entity.type, value: n.entity.value, label: n.entity.label } : null,
        })),
      },
      null,
      2
    ) + "\n"
  );
}
