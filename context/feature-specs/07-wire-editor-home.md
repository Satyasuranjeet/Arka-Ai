Read `AGENTS.md` and `context/ui-context.md` before starting.

Wire the editor home sidebar and dialogs to the real project API.

### Data Fetching

The editor home page is a client-side component.

Fetch owned and shared projects from the Python backend API immediately on initial load/mount and pass both lists to the sidebar.

Ensure the initial load data is ready before rendering the populated layout to prevent secondary client-side layout shifts.

### `useProjectActions`

Create a hook in `src/hooks/useProjectActions.js` that manages dialog state and project mutations.

**Create**

- manage create dialog state
- manage project name input
- generate a short unique suffix
- slugify the name to create the room ID
- call `POST /api/projects`
- navigate to the new workspace

The project ID and Liveblocks room ID should stay aligned.

**Rename**

- store target project id + current name
- call `PATCH /api/projects/{id}`
- refresh state on success

**Delete**

- store target project
- call `DELETE /api/projects/{id}`
- redirect to `/editor` if deleting the active workspace
- otherwise refresh state

### Wiring

Connect the hook to the sidebar and dialogs.

- create dialog shows room ID preview
- rename dialog pre-fills current name
- delete dialog shows project name

### Check When Done

- sidebar uses real project data
- create navigates to workspace
- rename updates correctly
- delete refreshes or redirects correctly
- frontend and backend compile and run smoothly without any compilation errors