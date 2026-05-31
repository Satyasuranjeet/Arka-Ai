Read `AGENTS.md` and `context/ui-context.md` before starting.

Add sharing to the workspace so project owners can invite collaborators by email.

## Share Dialog

Add a `Share` button to the editor navbar (`src/components/editor/EditorNavbar.jsx`) that opens the share dialog.

Owners can:
- invite collaborators by email
- view current collaborators
- remove collaborators
- copy the project link with temporary `Copied!` feedback

Collaborators can:
- view the collaborator list only
- not invite, remove, or manage access

## Clerk User Data

Collaborators are stored by email in the database (MongoDB Atlas).

Use the Clerk Backend API (via the official `clerk-backend-api` Python SDK on the backend) to enrich collaborator emails with:
- display name
- avatar image

If a Clerk user is not found for an email, fall back to showing the email only.

## Implementation

Add the required Python backend API logic for:
- listing collaborators (`GET /api/projects/{room_id}/collaborators`)
- inviting collaborators (`POST /api/projects/{room_id}/collaborators`)
- removing collaborators (`DELETE /api/projects/{room_id}/collaborators/{email}`)

Enforce project ownership server-side (in your Python endpoint logic) for invite and remove actions. Return HTTP `403 Forbidden` if a non-owner attempts these actions.

Do not add a local user table.

## Check When Done

- share dialog opens from the workspace
- owners can invite and remove collaborators
- collaborators see read-only access
- collaborator names/avatars load from Clerk when available
- React frontend builds successfully and Python backend runs cleanly without syntax or runtime errors