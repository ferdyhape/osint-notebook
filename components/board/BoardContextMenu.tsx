export type ContextMenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

/** A small right-click menu anchored at a screen point — closes on any click
 *  (or another right-click) outside itself, like a modal, matching the rest
 *  of the board's overlays (EntityDetailPanel, the pivot suggestions pane). */
export function BoardContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        className="card fixed z-50 py-1 min-w-[190px] max-w-[calc(100vw-1.5rem)]"
        style={{ left: x, top: y }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-surface-subtle ${
              item.danger ? "text-danger" : ""
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
