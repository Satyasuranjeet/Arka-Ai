# Architecture Context

## Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend Framework** | React + JavaScript (Vite) | Single Page Application (SPA) handling user interaction, state, and real-time canvas rendering. |
| **Backend Framework** | Python (FastAPI / Flask) | REST API endpoints for user validation, project management, and coordinating with third-party services. |
| **UI** | Tailwind CSS + shadcn/ui | Component composition, theme layouts, and responsive workspace styling. |
| **Auth** | Clerk | User identity management with the React Frontend SDK and token (JWT) verification on the Python backend. |
| **Database** | Prisma + PostgreSQL | Relational metadata tracking: projects, collaborator permissions, spec files, and background task histories using Prisma Client Python. |
| **Canvas** | Liveblocks + React Flow | Real-time collaborative canvas syncing, active user presence, and live multiplayer cursors. |
| **Background Tasks**| Trigger.dev | Managing durable, long-running AI generation pipelines and automated workflow steps. |
| **Artifact Storage** | Vercel Blob | Heavy file objects: active canvas snapshots and fully generated Markdown technical specification files. |

## System Boundaries

- `src/` — React frontend codebase root (Pure JavaScript).
  - `src/components/` — UI composition: canvas surfaces, sidebars, dialogs, and workspace elements.
  - `src/lib/` — Frontend infrastructure: Fetch/Axios API utilities and real-time canvas hooks.
- `backend/` — Python backend codebase root.
  - `backend/api/` — Authenticated HTTP endpoints: validation, ownership checks, task triggering, and persistence.
  - `backend/tasks/` — Scripts and functions orchestrated by Trigger.dev for AI design generation and spec generation.
  - `backend/schema.prisma` — Database schema file containing the relational tables and definitions.

## Storage Model

- **Database**: Stores metadata, ownership, collaborative relationships, and task run records.
- **Vercel Blob**: Stores heavy generated artifacts — canvas snapshots at `canvas/{project_id}.json` and specs at `specs/{project_id}/{spec_id}.md`.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas graph state and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL string is stored in the database (`canvas_json_path`, `file_path`) as the reference link to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID verified via JWT on the Python backend).
- Projects can include additional collaborators through project permission mapping in PostgreSQL.
- Only authenticated requests carrying a valid Clerk bearer token from the React frontend can access protected Python API routes.
- Only the owner or an authorized collaborator can mutate project resources.
- Liveblocks room tokens are issued by a specialized Python backend route only after verifying project membership.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored as local JSON files in the codebase.
- Templates are loaded directly into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor workspace at any time.
- Template data follows the exact same node/edge structural schema as user-created canvas content.
- Templates do not require separate relational database entries; they are resolved programmatically by template ID at import time.

## AI Generation Model

### Design Generation

- Input: user prompt, project context, and current canvas state payload.
- Execution: Durable background task handled via Trigger.dev, communicating back with the Python backend.
- Output: Structured node and edge updates written directly into the shared Liveblocks room via the Liveblocks REST API (executed from Python).

### Spec Generation

- Input: current canvas graph and project context.
- Execution: Durable background task via Trigger.dev.
- Output: Markdown technical specification pushed to Vercel Blob and linked to the project inside the PostgreSQL database.

## Invariants

1. Python API request handlers do not run long-lived AI work — that belongs entirely in Trigger.dev background tasks to prevent request timeouts.
2. Metadata (PostgreSQL) and large generated artifacts (Vercel Blob) are strictly stored in separate architectural layers.
3. Auth and ownership checks are explicitly enforced via backend middleware at every single mutation boundary.
4. The canvas schema must remain fundamentally identical between user-created content and imported templates to prevent client-side parsing failures in JavaScript.