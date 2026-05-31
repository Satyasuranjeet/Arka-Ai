Read `AGENTS.md` and `context/ui-context.md` before starting.

Add a bottom shape panel so users can drag shapes onto the canvas and create new nodes.

## Implementation

1. Add a floating pill-shaped toolbar at the bottom-center of the canvas layer (`src/components/editor/ShapePanel.jsx`).

2. Add draggable icon buttons for these shapes:
   - rectangle
   - diamond
   - circle
   - pill
   - cylinder
   - hexagon

3. When dragging a shape, include the shape name and default size in the drag payload using native HTML5 handling.

   Use sensible default sizes:
   - rectangles should be wider than tall
   - circles should be square
   - diamonds should be slightly larger so labels have room

4. Add `dragover` and `drop` handling to the canvas wrapper component.

5. On drop:
   - read the dragged shape payload from the drop event dataTransfer
   - convert the screen position to canvas coordinates using React Flow's instance method (e.g., `screenToFlowPosition`)
   - create a new node at that position in the Liveblocks/React Flow state
   - use an empty label (`""`)
   - use the default node color variable
   - use the dragged shape value

6. Generate each node ID string using the shape name, timestamp, and a counter.

7. Add a basic renderer component for the custom canvas node type (`src/components/editor/nodes/CanvasNode.jsx`) so new nodes are visible.

   For this unit, render every shape as a simple bordered rectangle with the label centered. Shape-specific visuals will be added later.

## Check When Done

- Shape drag payload includes the correct shape and size data.
- Drop logic creates new canvas nodes with the expected shape data.
- New nodes use the custom canvas node type mapping inside React Flow.
- The React frontend application compiles and builds successfully without any syntax or execution errors.