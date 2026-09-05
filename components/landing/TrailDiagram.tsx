/** The landing page's one memorable element: a relationship trail, drawn in the
 *  board's own grammar — type chip, mono value, a labelled connector with a
 *  direction arrow, one line curved and one straight. Inline SVG rather than a
 *  screenshot, so it stays crisp, follows the reader's light/dark theme through
 *  the same CSS variables the real board uses, and scales down to a phone
 *  without becoming an unreadable thumbnail of a dense canvas. */
export function TrailDiagram() {
  return (
    <svg
      viewBox="0 0 700 300"
      className="w-full h-auto"
      role="img"
      aria-label="A domain linked to an email address it was found from, and to a GitHub account belonging to the same person."
    >
      <defs>
        <marker
          id="trail-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-border)" />
        </marker>
      </defs>

      {/* Connectors sit behind the cards, exactly as they do on the board. */}
      <path
        d="M 206 140 C 300 132, 366 62, 462 52"
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="1.5"
        markerEnd="url(#trail-arrow)"
      />
      <path
        d="M 206 162 L 462 246"
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="1.5"
        markerEnd="url(#trail-arrow)"
      />

      <EdgeLabel x={334} y={92} width={82} text="found from" />
      <EdgeLabel x={334} y={204} width={108} text="same person as" />

      <EntityCard x={10} y={112} code="DO" type="DOMAIN" value="gameloft.com" chip={1} />
      <EntityCard x={470} y={14} code="EM" type="EMAIL" value="ferdy@gameloft.com" chip={3} />
      <EntityCard x={470} y={208} code="GI" type="GITHUB" value="ferdyhape" chip={5} />
    </svg>
  );
}

const CARD_WIDTH = 196;
const CARD_HEIGHT = 76;

function EntityCard({
  x,
  y,
  code,
  type,
  value,
  chip,
}: {
  x: number;
  y: number;
  code: string;
  type: string;
  value: string;
  chip: number;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        rx={12}
        fill="var(--color-surface)"
        stroke="var(--color-border)"
      />
      <rect
        x={x + 14}
        y={y + 21}
        width={34}
        height={34}
        rx={8}
        fill={`var(--chip-${chip}-bg)`}
      />
      <text
        x={x + 31}
        y={y + 43}
        textAnchor="middle"
        fill={`var(--chip-${chip}-fg)`}
        fontFamily="var(--font-data)"
        fontSize="12"
        fontWeight="600"
      >
        {code}
      </text>
      <text
        x={x + 58}
        y={y + 32}
        fill="var(--color-muted)"
        fontFamily="var(--font-body)"
        fontSize="9.5"
        fontWeight="600"
        letterSpacing="0.6"
      >
        {type}
      </text>
      <text
        x={x + 58}
        y={y + 51}
        fill="var(--color-text)"
        fontFamily="var(--font-data)"
        fontSize="12.5"
        fontWeight="600"
      >
        {value}
      </text>
    </g>
  );
}

function EdgeLabel({ x, y, width, text }: { x: number; y: number; width: number; text: string }) {
  return (
    <g>
      <rect
        x={x - width / 2}
        y={y - 12}
        width={width}
        height={24}
        rx={6}
        fill="var(--color-surface)"
        stroke="var(--color-border)"
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fill="var(--color-text)"
        fontFamily="var(--font-body)"
        fontSize="12"
        fontWeight="500"
      >
        {text}
      </text>
    </g>
  );
}
