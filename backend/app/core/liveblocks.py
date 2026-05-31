"""Liveblocks backend client utilities.

Provides a deterministic cursor-color mapper and the helper that exchanges
user metadata for a Liveblocks room access token via the REST API.
"""

import hashlib
import os

import httpx

# ---------------------------------------------------------------------------
# Cursor color palette
# Colours are taken from the canvas node vivid text palette defined in
# context/ui-context.md so they stay visually consistent with the board.
# ---------------------------------------------------------------------------

CURSOR_COLORS = [
    "#52A8FF",  # Blue
    "#BF7AF0",  # Purple
    "#FF990A",  # Orange
    "#FF6166",  # Red
    "#F75F8F",  # Pink
    "#62C073",  # Green
    "#0AC7B4",  # Teal
    "#00C8D4",  # Cyan (brand)
]


def get_cursor_color(user_id: str) -> str:
    """Deterministically map a user ID to a cursor color.

    Uses SHA-256 so the same user always gets the same color regardless of
    the order in which users join a room.
    """
    digest = int(hashlib.sha256(user_id.encode()).hexdigest(), 16)
    return CURSOR_COLORS[digest % len(CURSOR_COLORS)]


# ---------------------------------------------------------------------------
# Liveblocks REST API helpers
# ---------------------------------------------------------------------------

def _secret_key() -> str:
    return os.environ.get("LIVEBLOCKS_SECRET_KEY", "")


async def authorize_user(room_id: str, user_id: str, user_info: dict) -> dict:
    """Create a Liveblocks access token for *user_id* in *room_id*.

    Calls ``POST /v2/rooms/{roomId}/authorize-user``.  Liveblocks creates
    the room automatically when the first authorization request arrives,
    so no separate room-creation call is needed.

    Args:
        room_id:   Liveblocks room identifier (e.g. ``"project-abc123"``).
        user_id:   Stable user identifier (Clerk ``sub`` claim).
        user_info: Dict with ``name``, ``avatar``, and ``color`` keys.

    Returns:
        The JSON response from Liveblocks — ``{"token": "<jwt>"}`` — which
        is forwarded directly to the React client.

    Raises:
        httpx.HTTPStatusError: if the Liveblocks API returns a non-2xx status.
    """
    secret = _secret_key()
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"https://api.liveblocks.io/v2/rooms/{room_id}/authorize-user",
            headers={
                "Authorization": f"Bearer {secret}",
                "Content-Type": "application/json",
            },
            json={
                "userId": user_id,
                "userInfo": user_info,
            },
        )
        resp.raise_for_status()
        return resp.json()
