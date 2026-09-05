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
        // Percentage refWidth/refHeight/refX/refY (not the refWidth2-style
        // fixed-pixel modifiers) is the combination X6 actually sizes
        // correctly against the label's real rendered bbox — the fixed-pixel
        // variant produced a box that didn't track the text's true size.
        refWidth: "140%",
        refHeight: "150%",
        refX: "-20%",
        refY: "-25%",
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
