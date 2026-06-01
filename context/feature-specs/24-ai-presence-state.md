Read `AGENTS.md` and `context/ui-context.md` before starting.

# Collaborative AI Activity Indicators & Presence Signals

## Goal

Add shared AI activity indicators so everyone in the room can see when generation is in progress. This unit is only for UI, presence tracking, and real-time status signals. Do not add the actual AI generation flow yet.

## Implementation

1. Add AI thinking state to the sidebar panel (`src/components/editor/AiSidebar.jsx`).
   - Display a small animated status indicator (e.g., a subtle pulsate or loading text) when the AI's presence state is active.
   - Ensure this state is pulled from Liveblocks room presence so the indicator is visible to every active human user in the room simultaneously.
   - Programmatically disable the chat input `<textarea>` field while generation is flagged as active.
   - Swap the send button to a loading/disabled state overlay, but keep the rest of the sidebar tabs and layout scrollbars completely interactive and usable.

2. Add a shared AI status notification feed.
   - Check your existing Liveblocks client configuration setup and any installed room event listener features first.
   - Follow Liveblocks best practices for real-time storage broadcast events or room broadcast states instead of spinning up a separate custom WebSocket or parallel network channel.
   - Create or subscribe to a Liveblocks channel/event stream designated as `ai-status-feed`.
   - Subscribe to this real-time stream channel directly from within the AI Sidebar component context.
   - Dynamically capture and show only the single most recent string status message broadcast on the channel.
   - Keep the text feed format abstract enough to handle both visual canvas layout updates and system specification text outputs later.

3. Add status message validation.
   - Create a task runtime validation schema or utility validator function inside `src/utils/taskValidator.js`.
   - The validation schema must enforce an incoming payload structure supporting an optional or mandatory `text` string attribute.
   - Sanity-check and validate all incoming stream packets cleanly before pushing them into the state display loop.

4. Add thinking indicators to live collaborator cursors (`src/components/editor/LiveCursors.jsx`).
   - Read from the Liveblocks remote presence list hook.
   - Whenever an active participant slot (such as the AI agent user placeholder) features `thinking: true` inside their current presence data map, render a small spinning loader icon directly inside their floating cursor name badge container.
   - Instantly hide or unmount the spinner icon the moment the user's `thinking` flag resolves to false, null, or undefined.

## Scope Limits

- Don’t add real LLM token generations, backend fetch tasks, or prompt processing systems yet.
- Don’t trigger external background workers or dispatch jobs to Trigger.dev yet.
- Don’t lock, dim out, or render a full-screen loading backdrop over the sidebar area.
- Don’t build out or store a chronological list interface showing past log message history; only focus on the single active snapshot string.
- Keep this unit focused strictly on real-time visual synchronization states between users.

## Check When Done

- The AI Workspace sidebar accurately listens to and renders incoming real-time messages from the `ai-status-feed` channel.
- The prompt textarea input box and submit button correctly disable and adapt styles whenever the room presence reports an active generation phase.
- Floating collaborator cursor name badges successfully detect and toggle inline animation spinners based on real-time presence `thinking` boolean adjustments.
- Received stream payload objects are securely intercepted and validated through your frontend task utility modules.
- The React application compiles and builds successfully without any syntax, hook, or execution errors.