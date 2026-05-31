Read `AGENTS.md` and `context/ui-context.md` before starting.

Replace the default canvas edges with custom edges that feel easier to follow, easier to click, and support inline labels.

## Implementation

1. Add connection handles to every node inside your node renderer component (`src/components/editor/nodes/CanvasNode.jsx`).
   - Place native React Flow `<Handle />` elements explicitly on all four sides: top, right, bottom, and left.
   - Ensure users can fluidly connect from any handle boundary position to any other handle position.
   - Keep the handles subtle: style them as small white dots with a clean dark border outline.
   - Hide the handles entirely by default at rest, and fade them in smoothly using CSS transitions when hovering directly over the parent node container.

2. Add a default style structure for new edges.
   - Use a light stroke color palette with rounded stroke ends.
   - Attach an explicit arrowhead element at the target end of each connection line.
   - Force all newly created canvas connections to utilize your custom canvas edge renderer mapping.

3. Create the custom edge renderer component (`src/components/editor/edges/CanvasEdge.jsx`).
   - Use clean, right-angle orthoganol routing paths.
   - Keep edges slightly dimmed and muted at rest.
   - Brighten and highlight the stroke color when the edge line is hovered or selected.
   - Make edges significantly easier to hover and click by implementing a wider, invisible interaction container overlay path (e.g., a thick transparent `strokeWidth={20}` interaction line overlapping the visible line path) without increasing the actual visible line thickness.

4. Add inline edge label editing capabilities.
   - Double-clicking anywhere on an edge path must trigger the inline label editor mode.
   - Use React Flow's native `<EdgeLabelRenderer />` wrapper along with the layout midpoint calculation coordinates returned directly by the `getSmoothStepPath` utility function to position the text layer — do not calculate path midpoint math layout positions manually.
   - Render a text input element that dynamically grows in width to match the label text as the user types.
   - Save and commit the label value immediately on input element `blur`, or when pressing the `Enter` or `Escape` keys.
   - Render saved active edge labels as small, clean pill-shaped background badges.
   - When an active edge has an empty label string, display a faint, low-opacity hint element to indicate it can be edited.
   - Explicitly prevent label text click inputs and typing keyboard events from dragging, scrolling, or panning the canvas workspace layout (apply event pointer-blocking utility methods or classes like `nodrag` and `nopan`).
   - Stream and update edge label value changes reactively through your existing Liveblocks collaborative edge state data flow hooks.

## Scope Limits

- Don't change how dropped node elements are instantiated or positioned.
- Don't change or restyle the bottom shape panel toolbar layout.
- Don't redesign or alter the node visual renderer component beyond adding the four-sided connection handles described above.
- Keep this unit focused entirely on custom edge routing paths, path inline text labels, and connection handle interactions.

## Check When Done

- Node templates accurately render functional connection handles on all four perimeter sides.
- New edge connections cleanly default to the custom canvas edge type configuration complete with arrowheads.
- Edge hover, path tracking selection, and label input handlers are fully managed inside the custom edge renderer file.
- Edge text position layout is computed entirely using `EdgeLabelRenderer` and native path midpoint coordinates.
- Edge labels update dynamically across sessions through the existing collaborative edge data flow synchronization layer.
- The React frontend application compiles and builds successfully without any syntax, hook, or rendering execution errors.