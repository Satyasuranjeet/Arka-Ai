Read `AGENTS.md` and `context/ui-context.md` before starting.

# Implementation of the Full AI Design Agent

## Goal
Implement the full AI design agent loop inside your Python task worker so that a user prompt results in real-time updates on the collaborative canvas, with visible AI presence, status messages, and moving cursors.

## Implementation

1. Update the design agent task script inside `app/tasks/design_agent.py`.

   Before writing code:
   - Check `context/project-overview.md` and `context/architecture-context.md` for strict product behavior guidelines and layout canvas limits.
   - Review your established Trigger.dev worker pipeline and Liveblocks Python configurations to align with existing code patterns.
   - Use the official **Liveblocks Python SDK** (`liveblocks`) methods to perform document state manipulation and presence mutations.

   Then implement the following loop:
   - Use the Google GenAI library (`google-generativeai`) to interpret the incoming user prompt.
   - Fetch the current real-time canvas configuration map using Liveblocks storage query methods (`client.get_storage_document(room_id)`).
   - Instruct Gemini to output structural structural instructions matching your supported canvas operations:
     - Add Node
     - Move Node
     - Resize Node
     - Update Node Data (label, color, shape properties)
     - Delete Node
     - Add Edge
     - Delete Edge
   - Commit these canvas alterations directly to the live room via JSON Patches using the Liveblocks client (`client.patch_storage_document(room_id, body=patch)`). Make sure these mutations bypass the undo/redo stack histories so they don't break local user history states.

2. Broadcast real-time AI Presence & Activity.
   - Update the AI Agent's thinking flags and moving cursor coordinates directly while the job runs by sending presence payloads (`client.set_presence(room_id, body=...)`).
   - Push and update visible agent lifecycle messaging through Liveblocks custom notifications or real-time stream feeds at key steps:
     - `Start:` "Arka Ai is scanning the canvas..."
     - `Processing:` "Generating microservices layout structure..."
     - `Complete:` "Design complete! Added N elements."
   - Ensure all generated elements conform strictly to layout systems defined in `context/ui-context.md`:
     - Allowed shape properties (`rectangle`, `diamond`, `circle`, `pill`, `cylinder`, `hexagon`).
     - Allowed background and text color pairs from the theme palette.
     - Sensible default node bounding sizes and spacing layout grids.
   - Handle generation or API exceptions gracefully: if a step fails, write a clear error status announcement to the live channel and cleanly flush the AI's presence presence state (`cursor: null`, `thinking: false`) before closing out the job.

## Dependencies

Your Python backend environment already includes:
- `google-generativeai` (or your chosen Gemini engine package)
- `liveblocks` (The official Python SDK for Liveblocks)
- Access to `GOOGLE_AI_API_KEY` through your background `.env` variables.

## Scope Limits

- Don’t change the fundamental node/edge canvas data schemas or real-time architecture.
- Don’t establish a distinct, secondary database sync layer for canvas positions outside the Liveblocks core storage structure.
- Don’t bypass standard JSON Patch routines or push unformatted canvas structures into the room data block.

## Check When Done

- The background Python task successfully mutates live nodes and edges on the canvas via Liveblocks storage operations.
- The AI's live presence marker and matching cursor position updates translate across browser instances in real-time.
- Status update logs broadcast chronologically reflecting the actual progress states of the agent.
- Generation exceptions are safely intercepted and broadcast without breaking or clearing active human canvas work.
- The backend application runs seamlessly and the React frontend builds successfully without errors.