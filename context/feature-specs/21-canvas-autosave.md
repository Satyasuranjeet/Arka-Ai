Read `AGENTS.md` and `context/ui-context.md` before starting.

Add autosave and loading for the collaborative canvas so project state is persisted before adding AI generation. Canvas JSON should be stored in Vercel Blob, and the saved blob URL should be stored on the MongoDB project document.

## Implementation

1. Check the existing project schema.
   - Review your Python model structures inside `app/models/project.py`.
   - Ensure the `Project` schema explicitly supports a string field for the canvas blob URL (`canvas_blob_url`).
   - Keep MongoDB Atlas responsible for project metadata only.

2. Add canvas save/load backend API REST routes.
   Create: `PUT /api/projects/{project_id}/canvas`
   This route should:
   - receive the latest canvas JSON payload from the React frontend
   - handle authorization to verify the user has write access to the project
   - upload the raw JSON string/stream directly to Vercel Blob using Vercel's REST API endpoints via Python (`httpx` or `requests`)
   - store the returned Vercel Blob URL string on the matching MongoDB project document

   Create: `GET /api/projects/{project_id}/canvas`
   This route should:
   - read the project’s saved `canvas_blob_url` string value from MongoDB Atlas
   - fetch the saved canvas JSON payload from that specific Vercel Blob URL
   - return the completed canvas state object array back to the frontend editor

3. Add an autosave hook in `src/hooks/useAutosave.js`.
   - watch the active canvas nodes and edges arrays reactively
   - debounce saves (e.g., 2000ms window) to avoid triggering excessive, overlapping HTTP write requests
   - save data cleanly through the backend canvas API endpoint (`PUT /api/projects/{project_id}/canvas`)
   - track and expose save status states explicitly: `saving`, `saved`, and `error`

4. Load saved canvas state in the editor view.
   - when the editor loads, check if the real-time Liveblocks room has any existing nodes or edges in its active storage state
   - if the room is entirely empty and the database project record has a saved canvas blob URL, fetch and load that saved canvas state into the viewport
   - if the room already has nodes or edges from another live session collaborator, skip the backend load entirely to avoid overwriting or corrupting active collaboration

5. Add a small save status indicator in the editor layout's Save button area.
   - visually show and reflect `saving`, `saved`, or `error` state changes based on the tracking flags from the hook.

## Storage Pattern Matrix

- **MongoDB Atlas:** Stores project metadata records, identities, configuration scopes, and the remote `canvas_blob_url` location string.
- **Vercel Blob Storage:** Hosts the deep, unstructured flat JSON trees containing your raw collaborative nodes, edges, and positions data.

## Check When Done

- Project collection model definitions support storing the canvas blob URL.
- Save and load backend REST API endpoints use MongoDB Atlas for metadata tracking and Vercel Blob for canvas JSON storage.
- The custom frontend autosave hook cleanly debounces canvas saves as properties adjust.
- Editor Navbar button layout component correctly displays reactive save status indicators.
- Saved canvas layers are safely blocked from loading if the Liveblocks room state is already occupied by active data.
- The React frontend application compiles and builds successfully without any syntax, routing, or execution errors.