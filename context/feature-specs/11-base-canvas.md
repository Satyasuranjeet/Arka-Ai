Read `AGENTS.md` and `context/ui-context.md` before starting.

Replace the canvas placeholder with a Liveblocks-backed React Flow canvas.

## Implementation

1. Keep the workspace page wrapper protected via your frontend Workspace Route Guard (`src/components/editor/WorkspaceGuard.jsx`) to handle permission verification before mounting the main view container.

2. Create a client-side editor/canvas wrapper component (`src/components/editor/CanvasWrapper.jsx`) that sets up the Liveblocks room.

   It should include:
   - `LiveblocksProvider` using your Python backend auth route `/api/liveblocks-auth`
   - `RoomProvider` using the current room ID
   - initial presence with `cursor: null`
   - `ClientSideSuspense` with a simple loading state layout
   - an error fallback UI for handling Liveblocks socket connection issues cleanly

3. Wire React Flow directly to Liveblocks storage state.
   - use `useLiveblocksFlow` hook configuration
   - enable liveblocks suspense mode configuration
   - start with empty arrays `[]` for nodes and edges variables
   - pass the dynamically synced nodes, edges, and change event handlers straight into the main `ReactFlow` canvas element instance

4. Add shared canvas properties and schemas in a standard JavaScript constants/utilities file (`src/constants/canvas.js` or `src/utils/canvasHelper.js`).

   Node data models should support:
   - label
   - color
   - shape

   Also define the custom node and edge designators as string mappings:
   - `canvasNode`
   - `canvasEdge`

5. Render the basic canvas frame layout.

   Include:
   - loose connection logic behavior settings
   - `fitView` layout centering enabled
   - `MiniMap` accessory component view
   - dot-pattern background container layer background style

## Scope Limits

- don’t add toolbar controls or configuration side panels yet
- don’t add custom node or custom edge rendering layouts yet
- don’t add backend persistence logic or MongoDB saving procedures yet
- don’t add AI behavior tools or text streams
- keep this strictly focused on establishing a solid collaborative canvas foundation

## Check When Done

- Client canvas wrapper successfully builds and sets up the live Liveblocks room connection.
- React Flow successfully renders and uses Liveblocks-synced nodes and edges across active views.
- Shared canvas object structures exist cleanly in your frontend constants folder directory.
- The React SPA application compiles and builds successfully without any syntax, routing, or runtime errors.