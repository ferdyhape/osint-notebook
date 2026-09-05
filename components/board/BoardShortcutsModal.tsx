import { Modal } from "@/components/Modal";

type Shortcut = { keys: string; action: string };

const NAVIGATION: Shortcut[] = [
  { keys: "Scroll", action: "Pan up and down" },
  { keys: "Shift + scroll", action: "Pan left and right" },
  { keys: "Space + drag", action: "Pan in any direction" },
  { keys: "Ctrl + scroll, or Ctrl + = / −", action: "Zoom in and out" },
  { keys: "Arrow keys", action: "Pan step by step, with nothing selected" },
  { keys: "Ctrl + Shift + H", action: "Fit the whole board on screen" },
];

const EDITING: Shortcut[] = [
  { keys: "Drag on empty canvas", action: "Select several entities" },
  { keys: "Ctrl + A", action: "Select every entity" },
  { keys: "Ctrl + C", action: "Copy the selected entities' values" },
  { keys: "Arrow keys", action: "Nudge the selected entities a pixel" },
  { keys: "Shift + arrow keys", action: "Nudge the selected entities a grid step" },
  { keys: "Ctrl + Z / Ctrl + Shift + Z", action: "Undo / redo a move or a line change" },
  { keys: "Delete", action: "Delete the selected relationship" },
  { keys: "Right-click", action: "Options for an entity or a relationship" },
  { keys: "Esc", action: "Clear the selection and close panels" },
];

function Row({ keys, action }: Shortcut) {
  return (
    <li className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted">{action}</span>
      <kbd className="font-data text-xs whitespace-nowrap shrink-0">{keys}</kbd>
    </li>
  );
}

/** A board is only as usable as its shortcuts are discoverable — this is the one
 *  place that says out loud what the canvas responds to. */
export function BoardShortcutsModal({
  open,
  onClose,
  readOnly,
}: {
  open: boolean;
  onClose: () => void;
  readOnly: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Board shortcuts" width="wide">
      <div className="space-y-4">
        <div>
          <h3 className="eyebrow">Getting around</h3>
          <ul className="mt-1 divide-y divide-border">
            {NAVIGATION.map((shortcut) => (
              <Row key={shortcut.keys} {...shortcut} />
            ))}
          </ul>
        </div>
        {!readOnly && (
          <div>
            <h3 className="eyebrow">Editing</h3>
            <ul className="mt-1 divide-y divide-border">
              {EDITING.map((shortcut) => (
                <Row key={shortcut.keys} {...shortcut} />
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-muted">On a Mac, use Cmd wherever this says Ctrl.</p>
      </div>
    </Modal>
  );
}
