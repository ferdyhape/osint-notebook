import type { Graph } from "@antv/x6";
import { safeZoomToFit } from "@/components/board/safe-zoom";

type Props = {
  graph: Graph | null;
  /** Editors only — a read-only board has nothing to undo, so the whole group is hidden. */
  showHistory: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

/** Replaces React Flow's built-in <Controls> — X6 has no equivalent widget, so this is
 *  a small button row on our own design tokens instead of overriding a 3rd-party one. */
export function BoardControls({ graph, showHistory, canUndo, canRedo, onUndo, onRedo }: Props) {
  return (
    <div className="card absolute bottom-3 left-3 z-10 flex items-center gap-0.5 p-1">
      {showHistory && (
        <>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="btn btn-ghost btn-sm px-2 disabled:opacity-40"
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="btn btn-ghost btn-sm px-2 disabled:opacity-40"
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷
          </button>
          <span className="w-px self-stretch bg-border mx-1" aria-hidden />
        </>
      )}
      <button
        onClick={() => graph?.zoom(0.1)}
        className="btn btn-ghost btn-sm px-2"
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => graph?.zoom(-0.1)}
        className="btn btn-ghost btn-sm px-2"
        aria-label="Zoom out"
        title="Zoom out"
      >
        −
      </button>
      <button
        onClick={() => safeZoomToFit(graph)}
        className="btn btn-ghost btn-sm px-2"
        aria-label="Fit to view"
        title="Fit to view"
      >
        ⤢
      </button>
    </div>
  );
}
