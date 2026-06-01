Read `AGENTS.md` and `context/ui-context.md` before starting.

# Asynchronous AI Specification Generation Infrastructure

## Goal
Create the backend flow for AI-powered architectural/technical specification generation: authorization guards, a REST API route, a Trigger.dev background task, a token-issuing route, and task run ownership tracking. No frontend UI changes yet.

## Implementation

1. Add the specification trigger route.
   Create or update the Python REST API endpoint: `POST /api/ai/spec`
   This route must:
   - Extract the authenticated user identity using the Clerk JWT bearer token.
   - Accept a JSON body containing `roomId`, `chatHistory`, `nodes`, and `edges`.
   - **Security Guard:** Cross-reference the authenticated `user_id` with the project document containing this `roomId` in MongoDB to resolve access. Do not accept or trust a client-supplied `projectId` directly.
   - Dispatch the asynchronous `generate-spec` background job through your Trigger.dev Python worker setup.
   - Save a tracking document in your MongoDB `task_runs` collection to ensure strict client-side ownership and polling access control.
   - Return the Trigger.dev `run_id` back to the client.

2. Add the public access token route.
   Create or update the Python REST API endpoint: `POST /api/ai/spec/token`
   This route must:
   - Accept a JSON body payload containing a specific `runId`.
   - Authenticate the calling user via their Clerk identity context.
   - Verify that the matching `task_runs` document in MongoDB Atlas belongs to this specific `user_id`.
   - Issue a Trigger.dev public access token tightly scoped to that individual execution run.
   - Enforce an explicit token expiration lifespan configuration of 1 hour.
   - Return the public access token to the client so the frontend can securely monitor task progress.

3. Implement the background specification generation task worker.
   Create or update the Python background task module: `app/tasks/generate_spec.py`
   Define a background execution task that:
   - Accepts input parameters: `project_id`, `room_id`, `chatHistory`, `nodes`, and `edges`.
   - Validates the incoming parameters at runtime using your Python data validation layer (e.g., Pydantic or localized task validators).
   - Interfaces directly with Gemini using the official Google GenAI library (`google-generativeai`).
   - Generates a beautifully structured Markdown technical specification document by interpreting the combined visual canvas structure and sidebar text chat history contexts.
   - Updates the live task run metadata status using real-time Liveblocks channel broadcast streams (`ai-status-feed`) to inform users of execution steps.
   - Returns the completed, plain Markdown text compilation as the final task completion output.
   - Follow existing project configurations for retry backoffs, task logging parameters, and exception handling blocks.

## Scope Limits

- Don’t add frontend components, page views, or navigation items.
- Don’t construct a text document editor layout or Spec workspace panel UI yet.
- Don’t persist or write the final Markdown text blob permanently to your primary database project collection yet.
- Don’t rely on or derive resource security validation from client-provided project ID fields.
- Don’t build a secondary, unaligned abstract wrapper around your established Gemini AI configuration.

## Check When Done

- `POST /api/ai/spec` successfully validates inputs, maps project scopes from the room, and registers a background job returning a `run_id`.
- A valid query tracking document is created in your MongoDB Atlas `task_runs` collection for the authenticated identity.
- `POST /api/ai/spec/token` strictly denies tokens to anyone who is not the verified initializer of that specific task run.
- The `generate-spec` task operates successfully on your background infrastructure and produces well-structured plain Markdown output.
- The Python application launches successfully and the React frontend builds via Vite without syntax or compilation errors.