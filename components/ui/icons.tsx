/** Small hand-drawn stroke icons, sized/weighted to match the app's own design
 *  tokens rather than pulling in an icon library for a dozen glyphs. 16x16,
 *  `currentColor` throughout, so each one inherits its button's text color
 *  (including the danger-red hover state on row actions). */

type IconProps = { className?: string };

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconEdit({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M10.5 2.5a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12l-7 7L3 13l.5-3.5z" />
      <path d="M9.5 3.5l2 2" />
    </svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3 4.5h10" />
      <path d="M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5" />
      <path d="M4.5 4.5l.6 8a1 1 0 0 0 1 .95h3.8a1 1 0 0 0 1-.95l.6-8" />
      <path d="M6.6 7v4M9.4 7v4" />
    </svg>
  );
}

export function IconCopy({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="5.5" y="5.5" width="7.5" height="7.5" rx="1.3" />
      <path d="M3.5 10.2V3.8A1.3 1.3 0 0 1 4.8 2.5h6.4" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}

export function IconExternalLink({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6.5 3H3.8A1.3 1.3 0 0 0 2.5 4.3v7.9A1.3 1.3 0 0 0 3.8 13.5h7.9a1.3 1.3 0 0 0 1.3-1.3V9.5" />
      <path d="M9 2.5h4.5V7" />
      <path d="M13.2 2.8L7 9" />
    </svg>
  );
}

export function IconLink({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6.8 9.2a3 3 0 0 0 4.2.2l1.5-1.5a3 3 0 0 0-4.24-4.24L7.2 4.7" />
      <path d="M9.2 6.8a3 3 0 0 0-4.2-.2l-1.5 1.5a3 3 0 0 0 4.24 4.24L8.8 11.3" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

/** Two opposing arrows — swaps which side of a relationship is "from". */
export function IconSwap({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M2.5 5.5h9m0 0-2.5-2.5m2.5 2.5-2.5 2.5" />
      <path d="M13.5 10.5h-9m0 0 2.5-2.5m-2.5 2.5 2.5 2.5" />
    </svg>
  );
}
