Read `AGENTS.md` and `context/ui-context.md` before starting.

Replace the placeholder node renderer with proper shape rendering and a drag preview.

## Implementation

1. Replace the placeholder node shape rendering inside `src/components/editor/nodes/CanvasNode.jsx`.
   - `rectangle`, `pill`, and `circle` must use CSS/Tailwind styling.
   - `diamond`, `hexagon`, and `cylinder` must render with SVG shapes.
   - SVG shapes must scale perfectly with node size dimensions.
   - Keep borders subtle at rest and brighter/highlighted when selected.

2. Add a shape drag preview.
   - When dragging a shape from the shape panel, show a ghost preview of that shape.
   - Keep the preview attached to the cursor while dragging.
   - Use the same shape type and default size that will be used on drop.
   - Hide the preview after the shape is dropped or the drag is cancelled.
   - Keep this limited to drag preview behavior only.

3. Keep node rendering connected to the existing collaborative canvas state hooks.

## Scope Limits

- don't rebuild shape panel layout
- don't change how dropped nodes are created
- don't add resize or label editing yet
- keep drag/drop changes limited to the ghost preview only

## Check When Done

- Nodes render the correct shape variant for each type.
- CSS shapes render correctly for rectangle, pill, and circle.
- SVG shapes render and scale correctly for diamond, hexagon, and cylinder.
- Shape dragging shows a ghost preview matching the dragged shape.
- The React application compiles and builds successfully without any syntax, styling, or runtime errors.