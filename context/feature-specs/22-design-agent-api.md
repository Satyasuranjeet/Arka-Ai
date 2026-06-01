Read `AGENTS.md` and `context/ui-context.md` before starting.

# Design Generation Background Task Infrastructure (Trigger.dev)

## Goal

Set up the backend asynchronous execution flow for design generation using Trigger.dev. This unit handles triggering background jobs, tracking active runs, and issuing short-lived client-side public tokens. No actual AI logic yet.

## Implementation

1. Add the design trigger route.

   Create: `POST /api/ai/design`
   This Python REST API endpoint should:
   - Authenticate the client using the Clerk JWT bearer token.
   - Accept a JSON payload containing the generation prompt string and required framework context (`room_id`, `project_id`).
   - Trigger the external background design task through Trigger.dev (using Trigger.dev's Python SDK or direct HTTP REST worker ingest endpoints).
   - Instantiate and save a tracking document in your `task_runs` MongoDB collection.
   - Return the generated Trigger.dev background job run ID (`run_id`) to the React client.

2. Add task run tracking.

   Define a tracking schema model in your Python backend (e.g., inside `app/models/task_run.py`) to monitor Trigger.dev job runs and verify user ownership context.

   The `TaskRun` MongoDB document should include:
   - `id`: MongoDB ObjectId
   - `run_id`: Unique string matching the Trigger.dev execution reference
   - `project_id`: Unique string or ObjectId linking to the parent project
   - `user_id`: String mapping to the initiator's Clerk identity
   - `created_at`: Datetime timestamp

   Enforce database indexes on your Atlas cluster for:
   - A unique single-field index on `run_id`.
   - A compound query index combining `user_id` + `project_id` for fast authorization lookups.

3. Add the public access token route.

   Create: `POST /api/ai/design/token`
   This Python REST API endpoint should:
   - Accept a JSON payload containing a specific background `run_id`.
   - Resolve the calling user's Clerk ID and securely verify ownership context using the corresponding `task_runs` document from MongoDB Atlas.
   - Generate a secure, run-scoped Trigger.dev public token pointing exclusively to that single execution run.
   - Return the public token to the client so the React frontend can securely poll the worker status directly.

4. Create the design background task worker.

   Establish or extend your background job script layout (e.g., inside `app/tasks/design_agent.py` or your designated Trigger.dev framework configuration setup):
   - Check the existing Trigger.dev connection configurations and environment parameter variables first.
   - Reuse your project's existing worker setups instead of inventing an unaligned execution pattern.
   - Export or register a minimal asynchronous design task layout.
   - Accept the expected operational data payload: `prompt` and `room_id`.
   - Simply log, echo, or print out the received input metadata variables for this block phase.
   - Do not plug in real AI completion LLM logic or vector loops yet.

## Scope Limits

- Don’t generate, calculate, or inject structural layout nodes or connection edges yet.
- Don’t call, open sockets to, or pass embeddings to any AI providers (OpenAI, Anthropic, Gemini, etc.) yet.
- Don’t attempt to save state records or manually update the live room canvas layout.
- Keep this unit strictly focused on backend task triggering, access tokens, and task state tracking.

## Check When Done

- `POST /api/ai/design` successfully registers a background execution run with Trigger.dev.
- Task tracking records map cleanly to your MongoDB Atlas `task_runs` collection with accurate indexes applied.
- `POST /api/ai/design/token` strictly validates authorization against MongoDB and outputs a run-scoped token.
- The base background design task registers properly on your task worker architecture and can be executed cleanly.
- The Python application launches successfully and the React frontend builds without syntax or compilation errors.