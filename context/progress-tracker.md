# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 4: Projects & Canvas — **In Progress**

## Current Goal

- Continue Phase 4: implement canvas / React Flow workspace next.

## Completed

- `01-design-system.md` — shadcn/ui initialized (Tailwind v4, Vite, React JS); Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea components added to `src/components/ui/`; `lucide-react` installed; `src/lib/utils.js` with `cn()` created; dark-only theme CSS variables applied in `src/index.css`; Geist Sans/Mono fonts wired; `jsconfig.json` and `@` path alias configured.
- `02-editor-chrome.md` — `EditorNavbar` (`src/components/editor/EditorNavbar.jsx`) with sidebar toggle using `PanelLeftOpen`/`PanelLeftClose`; `ProjectSidebar` (`src/components/editor/ProjectSidebar.jsx`) as a fixed overlay with slide-in transition, Tabs (My Projects / Shared), placeholder empty states, and a full-width New Project button; `App.jsx` wired with `sidebarOpen` state; dialog pattern confirmed structurally ready via existing `dialog.jsx`.
- `03-auth.md` — `@clerk/clerk-react`, `@clerk/themes`, and `react-router-dom` installed; `ClerkProvider` with `dark` base theme from `@clerk/themes` wraps the app in `main.jsx`; `App.jsx` uses a `RootRedirect` component so `/` sends authenticated users to `/editor` and unauthenticated users to `/sign-in`; workspace route is now `/editor`; `ProtectedRoute` guard at `src/components/auth/ProtectedRoute.jsx`; sign-in/sign-up pages at `src/pages/SignInPage.jsx` and `src/pages/SignUpPage.jsx` use a two-panel layout (left: logo + tagline + feature list on `lg+`, right: Clerk component) with `appearance.elements` referencing CSS custom properties — no hardcoded colors; `<UserButton />` added to right section of `EditorNavbar`; authenticated API helper at `src/lib/api.js`; Python backend scaffolded at `backend/` with FastAPI, CORS, and `backend/middleware/clerk_auth.py` (RS256 JWKS JWT verification as a `require_auth` FastAPI dependency); `backend/requirements.txt` and `backend/.env` added.

- `04-project-dialogs.md` — Editor home screen with centered heading, description, and New Project button added to `WorkspacePage`; `useProjectDialogs` hook at `src/hooks/useProjectDialogs.js` managing dialog/form/loading state and mock project data; `ProjectDialogs` component at `src/components/editor/ProjectDialogs.jsx` with Create (name input + live slug preview), Rename (prefilled input, auto-focus, Enter submits), and Delete (destructive confirm) dialogs; `ProjectSidebar` updated with owned-project item rows, per-row actions menu (rename/delete hidden for shared projects), and a mobile backdrop scrim that closes the sidebar on tap.

- `05-prisma.md` — MongoDB Atlas data layer implemented. `motor`, `beanie`, and `dnspython` installed. `Project` and `ProjectCollaborator` Beanie document models created at `backend/app/models/project.py` with all required fields, status enum (`DRAFT`/`ARCHIVED`), timestamps, and indexes (`owner_id`, `created_at` on Project; unique compound `project_id`+`collaborator_email`, `collaborator_email`, and `project_id`+`created_at` on ProjectCollaborator). Cached Motor client singleton with Atlas Stable API at `backend/app/core/database.py`; `init_db()` calls Beanie `init_beanie()` on startup which creates all collections and indexes. FastAPI lifespan updated in `main.py` to call `init_db()`. `MONGODB_URI` and `MONGODB_DB` added to `backend/.env`. Old Prisma files (`db.py`, `schema.prisma`) removed.

- `06-project-apis.md` — Project REST API implemented in `backend/api/projects.py`. Four endpoints: `GET /api/projects` (list owner's projects), `POST /api/projects` (create; defaults name to `Untitled Project`), `PATCH /api/projects/{project_id}` (rename), `DELETE /api/projects/{project_id}` (delete, 204). All routes require a valid Clerk JWT bearer token; missing/invalid tokens return HTTP 401. Rename and delete enforce `owner_id` ownership check and return HTTP 403 for non-owners. Router registered in `main.py` via `app.include_router`. `HTTPBearer(auto_error=False)` + explicit 401 raise added to `clerk_auth.py` to ensure unauthenticated requests always return 401 (not 403).

- `07-wire-editor-home.md` — Editor home wired to real backend API. `src/hooks/useProjectActions.js` created: fetches owned projects from `GET /api/projects` on mount (with `isLoadingProjects` guard to prevent layout shifts), calls `POST /api/projects` on create (navigates to `/editor/:projectId`), `PATCH` on rename (updates list in-place), `DELETE` on delete (redirects to `/editor` if deleting the active project). Room ID preview (`slug-suffix`) generated with a stable per-dialog suffix and shown in the create dialog. `WorkspacePage` switched from `useProjectDialogs` to `useProjectActions` with a full-screen spinner while loading. `/editor/:projectId` route added to `App.jsx`. `ProjectDialogs` create preview label updated to "Room ID". `api.js` updated to return `null` for 204 No Content (DELETE).

## In Progress

- None.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Add context needed to resume work in the next session.
