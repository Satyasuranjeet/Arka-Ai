Read `AGENTS.md` and `context/ui-context.md` before starting.

# Workspace Shell Verification & Project Access Layer

## Goal

Build the `/editor/:roomId` workspace route shell with secure API-driven access verification. No frontend canvas rendering logic yet.

## Access Verification Flow

Because our React + Vite frontend is a Client-Side Rendered (CSR) SPA, route protection and access checks must be coordinated across the client router and a dedicated Python backend verification endpoint:

1. **Frontend Route Guard (`src/components/editor/WorkspaceGuard.jsx`):**
   - Intercepts requests to the `/editor/:roomId` route.
   - Forwards the user's Clerk Auth JWT token along with the requested `roomId` to the Python backend verification endpoint.
   - If the user is unauthenticated, redirect them immediately to `/sign-in`.
   - If the backend returns an unauthorized or non-existent status, render the `AccessDenied` component.
   - If authorization is successful, render the workspace view shell.

2. **Access Denied View Component (`src/components/editor/AccessDenied.jsx`):**
   - Centered screen layout.
   - Display a lock icon from `lucide-react`.
   - Clean, short access unauthorized message.
   - Navigation link back to the main `/editor` home screen.

## Python Backend Access Helpers & Endpoints

Create an access verification layer on the Python backend (e.g., `app/services/project_access.py` and a corresponding endpoint `GET /api/projects/verify-access/{room_id}`):

- **Identity Resolution:** Parse the Clerk JWT token sent in the request header to extract the user's authenticated `owner_id` and primary email address.
- **MongoDB Access Logic:** Query your MongoDB Atlas collection to confirm permissions:
  - Return access granted if the project document exists and the resolved user is the `owner_id`.
  - Return access granted if a document in your collaborator records links the project to the user's registered primary email address.
  - Return an HTTP `401 Unauthorized` or `403 Forbidden` if the project does not exist or the user lacks permissions.

## Layout Configuration

Build out the full-viewport workspace structure within your core layout view container (`src/pages/Workspace.jsx`):

- **Top Navbar:** Displays the project name reactively.
- **Navbar Actions Section:** Contains a share action button and an AI context sidebar toggle.
- **Left Sidebar Shell:** Render the existing `ProjectSidebar` layout, highlighting the active workspace `roomId` item within the list.
- **Central Canvas Area:** Displays a dark background filling the remaining screen space, holding a centered temporary workspace placeholder text message.
- **Right Sidebar Placeholder:** Reserved empty side layout area for future AI chat streams.

## Scope Boundary

Do not implement live canvas processing nodes, Liveblocks real-time synchronization hooks, functional AI streaming pipelines, or sharing authorization handlers yet.

## Check When Done

- Navigating to `/editor/:roomId` successfully forces a backend security check via your Python service.
- The `AccessDenied` view accurately traps missing, wrong, or unauthenticated route scopes.
- Workspace layout renders with full context matching the active project data values.
- Code compiles and executes across the frontend and backend without syntax or rendering errors.