Read `AGENTS.md` and `context/ui-context.md` before starting.

# Persist Generated Specs with MongoDB Atlas

## Goal
Persist AI-generated Markdown specification documents entirely within MongoDB Atlas for both file storage and structural metadata tracking, then add an authorized, secure download route so users can safely retrieve their compiled specification files.

## Implementation

1. Inspect Codebase and Update Document Schema.
   - **Codebase Pattern Check:** Before implementing, actively scan the codebase (specifically checking `app/models/` and existing database configuration utilities) to align with current collection registration routines, indexing rules, and BSON serialization helpers.
   - Review or update your Python document models inside `app/models/project_spec.py` or within the main `Project` model hierarchy.
   - Ensure a dedicated `project_specs` collection layout exists containing these structural fields:
     - `id`: Unique MongoDB ObjectId reference
     - `project_id`: Unique string or ObjectId linking to the parent project document
     - `content`: The raw, full Markdown specification string data text (or GridFS reference if files exceed document boundaries)
     - `created_at`: Datetime timestamp
   - Apply appropriate single-field and compound index rules to optimize project queries.

2. Save Generated Specifications.
   - Inside your backend background task script worker (`app/tasks/generate_spec.py`), immediately following a successful Markdown compilation from Gemini:
     - Extract and look up the parent project space using your existing database validation singleton methods.
     - Persist the raw plain Markdown text buffer directly into the `project_specs` collection within your MongoDB Atlas instance.
     - Ensure the metadata and contents are tightly coupled and linked to the correct project room context, matching project serialization patterns found during your codebase check.

3. Secure File Download Route.
   - Create the Python backend REST API endpoint: `GET /api/projects/{project_id}/specs/{spec_id}/download`
   - This endpoint must execute the following security matrix:
     - Authenticate the requesting user via their Clerk JWT bearer identity token.
     - Cross-reference the project documents in MongoDB Atlas to verify that the authenticated individual has valid access privileges to this project room space.
     - Verify that the target `spec_id` document exists and belongs explicitly to this specific `project_id` bucket.
     - Fetch the raw technical spec text directly from the matching MongoDB document field.
     - Return the content block directly to the user response as a downloadable attachment stream setting a header of: `Content-Disposition: attachment; filename="spec.md"`.
     - Gracefully capture error states and return proper standard HTTP Status codes: `404 Not Found` for missing database entries, and `403 Forbidden` for failed access authorizations.

## Scope Limits

- Don’t implement frontend React user interface panels, sidebars, or download button layouts.
- Don’t pull or rely on external cloud object buckets or Vercel Blob storage buckets for this feature.
- Don’t expose database document structures or IDs straight to the client layout browser without passing through access checks.
- Don’t touch, modify, or interrupt existing canvas background auto-saving and layout persistence mechanics.

## Check When Done

- Existing model patterns have been thoroughly verified against the current backend codebase structure.
- The `project_specs` metadata and content schema structure is fully supported inside your MongoDB collection models.
- The generation task loop successfully commits compiled Markdown datasets directly into MongoDB Atlas.
- The download REST endpoint verifies user session credentials against MongoDB permissions before streaming any byte assets.
- The download response outputs a true Markdown attachment payload header.
- The Python backend server and task workers launch seamlessly, and the React frontend builds successfully without errors.