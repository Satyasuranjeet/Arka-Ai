Read `AGENTS.md` and `context/ui-context.md` before starting.

Add a small floating color toolbar so selected nodes can change both their background and text color directly on the canvas.

## Implementation

1. Check `context/ui-context.md` for the node color palette.
   Each palette option includes:
   - a node background color
   - a matching text color

   Reuse existing theme colors if they already exist in the `src/globals.css`. Otherwise, keep the palette array in the canvas constants file, such as `src/constants/canvas.js`.

2. Add a toolbar above selected nodes (utilizing React Flow's `<NodeToolbar />` component inside `src/components/editor/nodes/CanvasNode.jsx`).
   - only show it when the node is selected
   - keep it positioned slightly above the node without overlapping its borders
   - show one swatch element per color pair
   - active swatches should feel clearly selected (e.g., using an active border ring or visible indicator)
   - hovering a swatch should show a subtle glow based on its specific paired text color
   - keep the shadow glow tight and controlled, not overly blurred or spread out
   - prevent toolbar interactions from dragging nodes or panning the canvas (apply utility classes like `nodrag` and `nopan`)

3. When a swatch is selected:
   - update both the node background color and text color in the synced node object data
   - update the node UI component immediately on the viewport screen
   - keep this state update inside the existing collaborative Liveblocks canvas state hook ecosystem
   - no direct backend database or Python API server calls

4. Selected nodes should visually reflect their active color pair.
   - The node background shape fill updates to the selected color, and the centered text automatically updates to its paired text color.

## Scope Limits

- don’t change drag/drop behavior from the previous files
- don’t rebuild node selection logic or standard React Flow selection behavior
- don’t add a full free-form hex color picker component
- keep this focused on predefined color themes and swatch palettes only

## Check When Done

- Nodes use predefined background/text color pairs correctly.
- Selected nodes display a clean floating color toolbar directly above the shape canvas bounds.
- Swatch selection successfully updates both node background fill and text element colors through the real-time sync hook layer.
- The React frontend application compiles and builds successfully without any syntax, styling, or runtime errors.