Read `AGENTS.md` and `context/ui-context.md` before starting.

Add resizing and inline label editing to canvas nodes.

## Implementation

1. Add resizing.
   - selected nodes should show resize handles (using React Flow utilities like `<NodeResizer />` inside `src/components/editor/nodes/CanvasNode.jsx`)
   - prevent nodes from being resized below a minimum size
   - keep resize handles subtle and consistent with the dark canvas UI theme

2. Add inline label editing.
   - keep the node label centered inside the node layout
   - double-click the center/label area of a node to edit its label
   - show placeholder text in the same centered position when the label is empty
   - keep editing smooth without causing layout shifts
   - show a textarea directly over the label while editing
   - update the label reactively as users type
   - close editing instantly on input element blur or when `Escape` is pressed
   - prevent text editing interactions from dragging or panning the canvas (apply pointer/event blocking classes like `nodrag` and `nopan`)

3. Keep all node updates connected to the existing collaborative canvas state hooks.

## Scope Limits

- don't change shape rendering from the previous unit
- don't change the shape panel or drag preview
- don't change how dropped nodes are created
- keep this focused on resize and label editing only

## Check When Done

- Selected nodes show resize handles.
- Resizing updates node dimensions through the existing node state flow.
- Double-clicking a node opens inline label editing.
- Label editing updates node labels through the existing sync flow.
- Editing closes on blur or Escape.
- Text interactions do not trigger canvas drag or pan.
- The React application compiles and builds successfully without any syntax, hook, or execution errors.