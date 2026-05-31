Read `AGENTS.md` and `context/ui-context.md` before starting.

The database schema is ready. Build the backend project API routes only.

## Routes

Create REST endpoints (using your Python framework like FastAPI or Flask) for:

- `GET /api/projects` - list current user’s projects
- `POST /api/projects` - create project
- `PATCH /api/projects/{project_id}` - rename project
- `DELETE /api/projects/{project_id}` - delete project

## Rules

Use the authenticated Clerk user ID (extracted from the validated frontend JWT bearer token) as `owner_id`.

When creating:
- Default a missing project name string to `Untitled Project`
- Use the MongoDB standard `ObjectId` strategy; do not introduce sequential integer IDs

Security:
- Unauthenticated requests must return an HTTP `401 Unauthorized` status
- Only the specific project owner can rename or delete that project document
- Any non-owner modification/deletion mutations must return an HTTP `403 Forbidden` status

Keep this backend-only inside your Python codebase. Do not wire or touch the React frontend UI code yet.

## Check When Done

- REST API endpoints exist and are testable for listing, creating, renaming, and deleting projects
- Strict `owner_id` authorization checks are enforced on the backend for rename and delete operations
- HTTP `401` and `403` error responses are handled and returned correctly with clean JSON error messages
- The Python application starts up and passes all server-side test executions cleanly without runtime or syntax errors