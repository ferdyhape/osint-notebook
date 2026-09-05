"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type ContextMenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

const EDGE_MARGIN = 8;

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
  const menuRef = useRef<HTMLDivElement>(null);
  // Starts at the raw click point and is corrected once, before paint, against
  // the menu's real measured size — a right-click near the right or bottom edge
  // of the board would otherwise open a menu running off-screen.
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPosition({
      left: Math.max(EDGE_MARGIN, Math.min(x, window.innerWidth - width - EDGE_MARGIN)),
      top: Math.max(EDGE_MARGIN, Math.min(y, window.innerHeight - height - EDGE_MARGIN)),
    });
  }, [x, y]);

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
      {/* `w-max` sizes the menu to its longest label instead of a fixed width —
       *  short menus like "Copy value" were padded out with dead space to the right. */}
      <div
        ref={menuRef}
        className="card fixed z-50 py-1 w-max min-w-[8rem] max-w-[calc(100vw-1.5rem)]"
        style={{ left: position.left, top: position.top }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`block w-full text-left whitespace-nowrap px-3 py-1.5 text-sm hover:bg-surface-subtle ${
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
