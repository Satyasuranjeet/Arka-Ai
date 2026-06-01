Read `AGENTS.md` and `context/ui-context.md` before starting.

# Collaborative AI Sidebar Real-Time Chat Infrastructure

## Goal

Add real-time room chat to the AI sidebar using a separate Liveblocks channel/event stream named `ai-chat`. This is only for peer-to-peer user chat messages inside the room. Keep it strictly separate from `ai-status-feed`, which handles AI progress logs, thinking indicators, and presence updates.

## Implementation

1. Add the `ai-chat` feed connection.
   - Before implementing, check your existing Liveblocks client configuration setup and follow the same feed patterns or broadcast event structures already established in the project.
   - Create or reuse a Liveblocks real-time communication stream channel designated as `ai-chat`.
   - Ensure the channel instance is explicitly room-scoped so messages stay localized to the active workspace.
   - **Do not mix or merge** this message stream with the `ai-status-feed` system.

2. Wire the chat feed into the sidebar panel UI (`src/components/editor/AiSidebar.jsx`).
   - Subscribe to the `ai-chat` real-time channel directly inside the scrollable chat viewport area of the AI Architect tab.
   - Accumulate and render incoming chat messages in chronological order (oldest at the top, newest at the bottom).
   - Display the sender's details (resolved via the Clerk user metadata, like display name or avatar), a formatted timestamp, and the raw text message content.
   - Keep the layout styling completely consistent with the existing sidebar UI tokens.
   - Use Tailwind utilities and existing localized components where they fit.

3. Add message sending behavior.
   - Allow users physically present in the workspace room to broadcast message payloads to the `ai-chat` stream channel.
   - Attach this broadcast operation to the existing sidebar `<textarea>` input and the designated "Send" action button.
   - Clear out the input field buffer immediately after a successful stream transmission event.
   - Display a small, non-intrusive red error text message underneath the input area if the socket connection drops or sending fails.

4. Add message runtime validation.
   - Create or reuse a **Zod** schema configuration inside your frontend validation utilities folder (e.g., `src/utils/taskValidator.js` or `src/constants/schemas.js`).
   - The message object layout must require the following fields: `senderId`, `role` (e.g., 'user'), `content`, and `timestamp`.
   - Explicitly validate all incoming data feed payloads through the Zod parser before appending them to the local UI rendering state array to avoid rendering corrupted or incomplete packets.

## Scope Limits

- Don’t plug in automated AI-generated responses or LLM mock data callbacks yet.
- Don’t trigger external background workers or dispatch prompt strings to Trigger.dev routes yet.
- Don’t mix user peer-to-peer chat message bubbles with systemic AI processing logs or status updates.
- Don’t spin up custom, parallel real-time architectures (like raw WebSockets or socket.io routes) outside your existing Liveblocks engine.
- Keep this unit focused strictly on a stable, shared multi-user human chat log foundation inside the room sidebar.

## Check When Done

- The AI Workspace sidebar successfully subscribes to and mounts the `ai-chat` room stream feed.
- Collaborative room users can seamlessly dispatch chat payloads through the primary sidebar text block input.
- Message data frames are securely parsed and validated through your frontend Zod schema before hitting the render phase.
- The `ai-chat` messaging channel operates independently from the systemic `ai-status-feed` pipeline.
- The React frontend application compiles and builds successfully via Vite without any syntax, hook, or execution errors.