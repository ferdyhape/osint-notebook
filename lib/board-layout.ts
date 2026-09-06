/**
 * Pure entity-card sizing — no imports, no "server-only", no Prisma. Kept out
 * of lib/board.ts on purpose: that file pulls in "server-only" and Prisma for
 * its data-fetching side, and the live board (a Client Component) needs this
 * same sizing math to resize a card in place after an inline edit or a new
 * note — bundling it would otherwise drag the server-only module into the
 * client bundle and fail the build.
 *
 * X6 nodes need explicit dimensions, unlike a React Flow node's auto-sizing
 * div. Width is fixed (long values truncate rather than reflowing the
 * board), height is derived per entity: a card carrying neither a label, a
 * source nor any notes is two lines tall, and padding every card out to the
 * tallest possible one left most of them visibly half empty. The constants
 * below mirror EntityNode.tsx's own spacing — keep them in step with it.
 */

export const NODE_WIDTH = 248;
const RING_INSET = 16; // EntityNode's `inset-[16px]` drag-to-connect ring margin, per side
const CARD_PADDING_Y = 12; // `py-3`, per side
const CARD_BORDER = 1; // `.card` border, per side
const HEADER_HEIGHT = 35; // type eyebrow + value line (taller than the 32px type chip beside it)
const LABEL_LINE = 18; // extra line above the value when a friendlier label is set
const SOURCE_LINE = 20; // `mt-0.5` + one `text-xs` line
const NOTE_ROW = 37; // `mt-2.5` + `pt-2` + 1px divider + one `text-xs` line

export function entityNodeHeight(entity: { label?: string | null; source: string | null; noteCount: number }) {
  return (
    2 * (RING_INSET + CARD_PADDING_Y + CARD_BORDER) +
    HEADER_HEIGHT +
    (entity.label ? LABEL_LINE : 0) +
    (entity.source ? SOURCE_LINE : 0) +
    (entity.noteCount > 0 ? NOTE_ROW : 0)
  );
}
