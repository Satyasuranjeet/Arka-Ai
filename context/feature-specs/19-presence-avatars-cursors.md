Read `AGENTS.md` and `context/ui-context.md` before starting.

Show active room participants inside the editor canvas view, without changing the editor home navbar.

## Implementation

1. Keep the existing navbar behavior completely as-is.
   - Do not modify or refactor the editor home navbar.
   - Do not move or redesign the shared navbar component globally across the app.
   - If the editor home dashboard and editor workspace canvas utilize the same layout shell or navbar component, make sure this live presence UI layer explicitly only renders when inside the active canvas/editor room view.

2. Add the participant avatar group component inside the editor canvas viewport layer (`src/components/editor/PresenceBar.jsx`).
   - Position it absolute in the top-right corner of the editor canvas view container, sitting floating over the canvas grid.
   - Keep it visually clean and separate from your core navbar action buttons.
   - Extract the current user's ID from your active frontend Clerk authentication session context.
   - Filter the Liveblocks presence user list to exclude any entry whose user ID matches the currently logged-in Clerk user ID.
   - Render the resulting filtered list as collaborator avatars only.
   - Render the current user separately using Clerk's native `<UserButton />` component — do not render a duplicated second avatar circle for them out of the Liveblocks room presence array.
   - Ensure the collaborator avatar circles and the Clerk `<UserButton />` share the exact same sizing dimensions so the group remains visually unified.
   - Collaborator avatar items are display-only and must be non-interactive.
   - Show a thin vertical divider line between the collaborator stack and the Clerk `<UserButton />` only when at least one remote collaborator is active in the room.
   - If no other collaborators are in the room, display only the Clerk `<UserButton />` with the divider element hidden.

3. Render collaborator avatars with clean fallback styling.
   - Display profile photo URLs when provided by the Liveblocks user metadata state.
   - Fall back gracefully to rendering the user's initials when no image asset is available.
   - Display a maximum of five collaborator avatars in a tightly packed, overlapping horizontal flex stack.
   - Append a `+N` numerical overflow badge/chip at the end of the line whenever there are more than five active remote users.
   - Apply a subtle dark border ring around each avatar element so they remain readable against the dark canvas background grid.

4. Add live collaborative cursors to the canvas viewport (`src/components/editor/LiveCursors.jsx`).
   - Render cursor tracking elements for other active participants only—never draw a cursor for the current local user.
   - Map and broadcast cursor coordinate positions using your Liveblocks presence hooks.
   - Capture and update the current user's local cursor position payload directly on React Flow's `onMouseMove` event handler.
   - Set the cursor state value back to `null` immediately whenever an `onMouseLeave` canvas event fires.
   - Render remote cursors as a small colored SVG pointer icon with a floating name badge tag appended closely below it.
   - Match the SVG fill color and badge background styling exactly to that specific participant's assigned presence cursor color.

5. Document and use the shared presence data layer fields inside `src/liveblocks.config.js`.

   The configuration object schema must follow:
   - `cursor`: `{ x, y }` or `null`
   - `thinking`: boolean value

## Scope Limits

- Don't inject presence avatar circles or overflow counts into the shared global layout navbars.
- Don't alter, remove, or hide existing navbar utility controls like Save, Import, Share, or AI sidebars.
- Don't wrap or replace Clerk's native user profile management or logout event lifecycles.
- Don't make collaborator avatar stack items clickable, hoverable, or interactive.
- Don't change or interrupt canvas node drag patterns or custom edge connecting behaviors.

## Check When Done

- Presence tracking avatars explicitly display only inside the editor canvas room viewport views.
- The global editor home view dashboard navbar remains completely unaffected.
- Current active user identity resolves cleanly from the client-side Clerk session context.
- Remote collaborator loops explicitly filter out and exclude the current local user's card.
- The visual avatar stack divider element dynamically mounts and unmounts depending on collaborator counts.
- Cursor positions broadcast immediately across Liveblocks presence synchronization hooks on React Flow mouse capture frames.
- The workspace viewport dynamically renders live moving pointers for remote participants only.
- The React frontend application compiles and builds successfully without any syntax, hook, or rendering errors.