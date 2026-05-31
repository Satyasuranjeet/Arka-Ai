Read `AGENTS.md` and `context/ui-context.md` before starting.

# MongoDB Atlas Schema And Data Layer

## Goal

MongoDB Atlas connection layer is ready to be configured. Add the project data models, MongoDB client connection singleton, and the initial collection index creation script.

## Models

Create backend schemas and document models in `app/models/project.py` (or your project's Python models directory).

Add `Project`:
- `owner_id` mapped to Clerk user ID (String)
- `name` (String)
- optional `description` (String)
- status enum or literal choices: `DRAFT`, `ARCHIVED`
- `canvas_json_path` for future canvas blob storage (String)
- timestamps (`created_at` and `updated_at`)
- database indexes on `owner_id` and `created_at`

Add `ProjectCollaborator`:
- project relation with cascade delete handling (managed programmatically in the Python service layer)
- `collaborator_email` (String)
- creation timestamp (`created_at`)
- unique compound constraint/index on `project_id` and `collaborator_email`
- database indexes on `collaborator_email` and the compound `project_id` / `created_at`

Do not add extra fields unless required by your Python ODM/driver.

## Database Client Singleton

Create a database configuration utility (e.g., `app/core/database.py`).

Branch behavior or configure connection dynamically using `MONGODB_URI`:
- Connect asynchronously using `motor.motor_asyncio.AsyncIOMotorClient`.
- If your environment requires specific Atlas performance tuning (like server api versions), configure it here.
- Cache/re-use the client connection singleton across the Python application process to prevent leaking connections during development hot reloads.

## Database Initialization / Index Setup

Run an initialization script or setup function on application startup to programmatically build the collections, apply the unique constraints, and build the required indexes in your MongoDB Atlas cluster.

## Dependencies

Ensure these are present in your Python environment:
- `motor` (Asynchronous Python driver for MongoDB)
- `pydantic` or `beanie` (for Object Document Mapping and schema data parsing)
- `dnspython` (required to resolve `mongodb+srv://` Atlas connection strings)

## Check When Done

- Database schema has both models defined with accurate relations, constraints, and indexes
- `app/core/database.py` (or equivalent) exports one reusable, cached database client instance
- Index creation script runs successfully against your MongoDB Atlas cluster instance
- Python backend application runs and starts up without compilation or runtime errors