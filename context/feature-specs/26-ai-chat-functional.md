Read `AGENTS.md` and `context/ui-context.md` before starting.

# AI Workspace Sidebar Real-Time Execution Binding

## Goal
Wire up the AI sidebar so users can submit design prompts, track AI task run status in real time using Trigger.dev client tokens, and automatically reflect AI-driven canvas mutations on screen through Liveblocks.

## Implementation

1. Submit execution from the AI Sidebar.
   - On text input form submission:
     - Push the local human user message payload directly to the room-scoped Liveblocks `ai-chat` stream feed.
     - Dispatch an authorized network request calling your Python backend endpoint: `POST /api/ai/design` containing JSON parameters `{ prompt, roomId, projectId }`.
     - Read and parse the target tracking structures returned from the backend response: `{ run_id, public_token }`.
     - Cache and maintain `runId` and `publicToken` states inside your sidebar component's local React state hooks.

2. Background job run status tracking.
   - Hook into the Trigger.dev client state machine by executing: `useRealtimeRun(runId, { accessToken: publicToken })`.
   - While the background execution run is active or processing:
     - Programmatically add a `disabled` state attribute to your prompt `<textarea>` input field.
     - Switch your submit button layout to an unclickable loading state containing an inline animated spinner icon.
   - The moment the hook reports that the run successfully completes:
     - Push a final confirmation AI response payload to the Liveblocks `ai-chat` stream feed.
     - Reset the loading indicators and flush the temporary run state parameters back to clean default values.

3. Live canvas synchronization.
   - **Do not manually update or calculate local frontend node and edge state arrays** inside this execution block.
   - Rely entirely on the Liveblocks client data loop (`useLiveblocksFlow` or your configured room storage subscription layer) to automatically reflect changes in real time.
   - AI-driven adjustments to layout nodes, connection edges, and real-time cursor pointers pushed via the Python backend's JSON Patches must stream down and mount into the React Flow viewport automatically.

4. Multi-user status display strip.
   - Read and subscribe to the single latest real-time string emitted from the Liveblocks `ai-status-feed` event pipeline.
   - Render a compact, single-line horizontal status bar strip directly above your chat message text input field **only** when a background job run is actively flagged as executing.

## UI Details & Style Systems

- **Theme Compliance:** Strictly utilize established CSS utility variables mapped out inside your `src/globals.css` and `context/ui-context.md`. Do not declare new unmapped hexadecimal values.
- **Chat Bubble Layouts:**
  - **Human User:** Green accent background color fill (`#62C073`), styled with strong, readable high-contrast typography text.
  - **AI Agent:** Elevated dark card background color fill, paired with a soft, light-colored muted text color.
- **Submit Button Interaction Matrix:**
  - **Enabled State:** Green accent color fill (`#62C073`) with full interactive click opacity.
  - **Disabled/Muted State:** Low-opacity dimmed container layout with click events blocked.
  - **Running State:** Inject a small revolving CSS spinner icon directly alongside or replacing the submit icon.
- **Status Strip Structure:**
  - Mount a flat compact banner spanning the horizontal bounds of the sidebar, sitting right on top of the input wrapper.
  - Style it with a dark base foundation and a crisp green accent border/text layout. A tight, non-intrusive flashing or pulsing indicator dot is encouraged.
- **Error Propagation:** Intercept any network transaction or socket streaming failure codes gracefully and append them directly as fallback error message nodes into the local `ai-chat` feed layout.

## Scope Limits

- Don’t write, override, or alter Python backend routes or background task handlers during this task.
- Don’t trigger secondary REST calls to fetch final full graph datasets; rely completely on Liveblocks' reactive storage loops.
- Don’t adjust, split, or modify the structural placement or tab logic of the parent sidebar element wrapper.
- Don’t inject manual, temporary client-side mock values directly into the core React Flow node storage stack.

## Check When Done

- Submitting a prompt successfully triggers your Python `POST /api/ai/design` route and cleanly extracts tracking variables.
- The `useRealtimeRun` state listener establishes a secure connection to the worker process using the run-scoped token.
- The chat textarea prompt input box correctly disables and locks focus boundaries during live execution cycles.
- The interactive compact status feed bar renders on screen exclusively when a background job run is active.
- Chat updates and systemic AI progress announcements broadcast successfully across separate active browser user sessions.
- The React application compiles and builds flawlessly through Vite without any syntax, hook, or execution error screens.