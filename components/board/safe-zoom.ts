import type { Graph } from "@antv/x6";

/** `zoomToFit`'s new-scale formula is `(viewport / content) * currentScale` —
 *  it's *relative* to whatever the graph's scale already is, not an absolute
 *  fit. On a graph that has never been explicitly scaled yet, that current
 *  scale can be 0, which collapses the result to 0 too (a blank board) and,
 *  worse, feeds a divide-by-zero into the MiniMap plugin's own (unguarded)
 *  reaction to the resulting 'resize' event — a real, reproduced crash
 *  ("Failed to set … SVGMatrix … non-finite"). Resetting to a known 1:1
 *  scale first makes the fit computation an absolute one, sidestepping both.
 *  The try/catch is a second line of defense in case of some other cause. */
export function safeZoomToFit(graph: Graph | null) {
  if (!graph) return;
  try {
    graph.scale(1, 1);
    graph.zoomToFit({ padding: 32, maxScale: 1 });
  } catch {
    // A missed fit-to-view isn't worth surfacing — the user can still pan/zoom
    // manually, or press "Fit to view" again.
  }
}
