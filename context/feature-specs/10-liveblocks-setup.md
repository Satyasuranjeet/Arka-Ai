Read `AGENTS.md` and `context/ui-context.md` before starting.

Set up the realtime collaboration infrastructure using Liveblocks.

## Configuration

Configure the `src/liveblocks.config.js` at the project root.

Define:

### Presence

- cursor position
- `isThinking` boolean

### UserMeta

- user ID
- display name
- avatar URL
- cursor color

## Liveblocks Client

Create a cached Liveblocks client initialization utility on the Python backend (e.g., `app/core/liveblocks.py`).

Add a helper that deterministically maps a user ID to a consistent color from a fixed palette.

## Auth Route

Create `POST /api/liveblocks-auth` as a Python backend API endpoint.

Use the project ID as the Liveblocks room ID.

This route must:

1. require Clerk authentication
2. verify project access using the existing access helper
3. ensure the Liveblocks room exists (create only if needed via Liveblocks Backend REST API / SDK calls)
4. return a session token with:
   - user name
   - avatar
   - generated cursor color

Return `403` for unauthorized project access.

## Dependencies

All required Liveblocks packages are already installed.

## Check When Done

- `src/liveblocks.config.js` defines Presence and UserMeta
- Liveblocks backend client is cached
- auth route verifies project access
- user metadata is attached to sessions
- React frontend builds successfully and the Python backend executes with zero runtime or syntax errors