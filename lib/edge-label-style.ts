/** Shared "pill" markup for a relationship edge's label — used both server-side
 *  (lib/board.ts, building the initial X6 JSON) and client-side (InvestigationBoard.tsx,
 *  adding a brand-new edge after the user confirms a connection). Deliberately not
 *  relying on X6's `defaultLabel` shape config for this — a shape's `defaultLabel`
 *  and an explicit `labels` array both render, which doubled every label. */
export function relationshipLabel(text: string) {
  return {
    markup: [
      { tagName: "rect", selector: "body" },
      { tagName: "text", selector: "label" },
    ],
    attrs: {
      label: {
        text,
        fill: "var(--color-text)",
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "var(--font-body)",
        textAnchor: "middle",
        textVerticalAnchor: "middle",
        pointerEvents: "none",
      },
      body: {
        ref: "label",
        refWidth: "100%",
        refHeight: "100%",
        refX: 0,
        refY: 0,
        refWidth2: 16,
        refHeight2: 8,
        refX2: -8,
        refY2: -4,
        rx: 6,
        ry: 6,
        fill: "var(--color-surface)",
        stroke: "var(--color-border)",
        strokeWidth: 1,
      },
    },
    position: 0.5,
  };
}
