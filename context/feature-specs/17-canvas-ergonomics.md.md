Read `AGENTS.md` and `context/ui-context.md` before starting.

Add a floating control bar for zoom and undo/redo, then wire the same actions to keyboard shortcuts.

## Implementation

1. Add a pill-shaped control bar component at the bottom-left of the canvas view layer (`src/components/editor/ControlBar.jsx`).
   - It must sit positioned clearly above the bottom shape panel.
   - Separate the buttons into two distinct visual groups using a thin divider line:
     - Zoom controls: zoom out, fit view, zoom in
     - History controls: undo, redo

2. Wire the zoom controls directly to your active React Flow instance hooks or methods.
   - Zoom in (`zoomIn`)
   - Zoom out (`zoomOut`)
   - Fit view (`fitView`)
   - Apply a short animation duration configuration to these instance movements so the transitions feel smooth and fluid.

3. Wire the undo and redo buttons to your Liveblocks history state.
   - Use the existing Liveblocks `useUndo` and `useRedo` hooks (or equivalent room history stack pointers).
   - Automatically disable the undo button element when there are no historical mutations left to undo.
   - Automatically disable the redo button element when there are no forward mutations left to redo.
   - Keep all disabled state buttons visually dimmed, muted, and non-interactive.

4. Create a custom key listener hook in `src/hooks/useKeyboardShortcuts.js`.
   - The hook must cleanly receive the running React Flow instance reference.
   - The hook must receive the functional undo and redo callback handlers.
   - Add standard event listeners on the `window` global object to capture keydown triggers.
   - Ensure the listener explicitly ignores and skips shortcut behaviors whenever the user is actively focusing or typing inside input boxes, textareas, or content-editable text fields (e.g., using `event.target.tagName` checks or checking for custom text field classes).

5. Support and bind these exact keyboard shortcuts:
   - `+` or `=` to trigger zoom in
   - `-` to trigger zoom out
   - `Cmd + Z` (Mac) or `Ctrl + Z` (Windows/Linux) to trigger undo
   - `Cmd + Shift + Z` (Mac) or `Ctrl + Shift + Z` (Windows/Linux) to trigger redo
   - `Cmd + Y` (Mac) or `Ctrl + Y` (Windows/Linux) to alternatively trigger redo

## Scope Limits

- Don’t alter or change the bottom shape panel toolbar layout from previous tasks.
- Don’t change or modify canvas node or custom edge rendering layout implementations.
- Don’t add any extra canvas macro control UI accessories outside the specified sets.
- Don’t touch, alter, or break the existing real-time collaborative state orchestration.

## Check When Done

- Floating control bar accurately renders in the bottom-left space of the canvas wrapper.
- Zoom interaction buttons correctly adjust viewport scales via the React Flow instance.
- Undo and redo interaction buttons interface seamlessly with the Liveblocks room history.
- Keyboard macro shortcuts are fully captured and handled inside `src/hooks/useKeyboardShortcuts.js`.
- Shortcut event handlers safely bypass actions whenever text input boxes or textareas hold focus.
- The React application compiles and builds successfully without any syntax, hook, or execution errors.