# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component, route, or utility script.
- Respect the system boundaries defined in `architecture-context.md`.

## React & JavaScript (Frontend)

- Use modern ES6+ features cleanly (destructuring, async/await, optional chaining).
- Keep components focused entirely on rendering and user interaction; extract complex business logic or data fetching into custom hooks or utility functions.
- Use JSDoc comments (`/** ... */`) above functions and component parameters to document expected object structures where helpful.
- Avoid tracking unnecessary state; if a value can be computed directly from existing state or props, calculate it on the fly.

## Python (Backend)

- Follow PEP 8 guidelines for clean, readable Python code.
- Use explicit type hinting where possible (`def get_project(project_id: str) -> dict:`) to maintain clarity and catch bugs early.
- Keep route file dependencies organized—leverage FastAPI dependencies or Flask before-request hooks to cleanly inject authentication and database sessions.
- Long-running work belongs entirely in Trigger.dev background tasks; never block the main Python request thread.

## Styling

- Use CSS custom property tokens defined in your global CSS—avoid raw Tailwind color classes like `zinc-*` or hardcoded hex values.
- Reference tokens through your configured Tailwind utility names: `bg-base`, `text-copy-primary`, `border-surface-border`, `text-brand`, etc.
- Maintain the consistent border radius scale: `rounded-xl` for small elements, `rounded-2xl` for cards, `rounded-3xl` for modals.

## API Endpoints (Python Backend)

- Validate and parse incoming request payloads (using Pydantic models for FastAPI or Marshmallow/schemas for Flask) before any business logic executes.
- Enforce Clerk authentication token verification and project ownership checks before processing any database mutation.
- Return consistent, predictable JSON response shapes across all endpoints.
- Keep endpoint handlers thin — push complexity into backend service modules or Trigger.dev tasks.

## Data and Storage

- Project metadata and collaborator relationships belong in PostgreSQL via Prisma Client Python.
- Canvas snapshots and generated specs belong in Vercel Blob; your database stores only the string URL reference.
- Do not store large generated content payloads directly in the database.
- Task run records are first-class relational data — treat ownership and run IDs as verified before any mutation or token issuance.

## File Organization

- `src/` — React frontend codebase (Pure JavaScript):
  - `src/components/` — UI layout components only; no heavy business logic.
  - `src/lib/` — Shared infrastructure: API fetching wrappers, shared state hooks, and utilities.
- `backend/` — Python backend codebase:
  - `backend/api/` — Route endpoint handlers for authentication routing, task triggering, and database data persistence.
  - `backend/tasks/` — Code logic orchestrated by Trigger.dev for asynchronous background pipelines and AI workflows.
  - `backend/services/` — Shared backend infrastructure: database clients, storage adapters, and helper utilities.
- Name files clearly after the specific responsibility they contain, not the underlying technology framework.