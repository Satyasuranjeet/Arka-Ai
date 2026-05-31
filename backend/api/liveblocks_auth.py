"""Liveblocks authentication endpoint.

POST /api/liveblocks-auth
    Requires a valid Clerk JWT (Authorization: Bearer …).
    Verifies project access, then exchanges user metadata for a
    Liveblocks room access token.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.liveblocks import authorize_user, get_cursor_color
from app.services.clerk_service import get_user_email_by_id, get_user_info_by_id
from app.services.project_access import verify_project_access
from middleware.clerk_auth import CurrentUser

router = APIRouter(prefix="/api", tags=["liveblocks"])

_ROOM_PREFIX = "project-"


class LiveblocksAuthBody(BaseModel):
    room: str


@router.post("/liveblocks-auth")
async def liveblocks_auth(body: LiveblocksAuthBody, user: CurrentUser):
    """Exchange a Clerk JWT for a Liveblocks room access token.

    Steps:
    1. Validate room ID format (must be ``project-{projectId}``).
    2. Verify the authenticated user has owner or collaborator access.
    3. Resolve user display name and avatar via Clerk API.
    4. Generate a deterministic cursor color for the user.
    5. Call the Liveblocks REST API to issue the room token.
    6. Return ``{"token": "…"}`` to the React client.
    """
    room_id = body.room
    user_id = user["sub"]
    user_email = user.get("email", "")

    # Validate room ID format
    if not room_id.startswith(_ROOM_PREFIX):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid room ID — expected '{_ROOM_PREFIX}{{projectId}}'.",
        )

    project_id = room_id[len(_ROOM_PREFIX):]

    # Verify project access — raises 404 or 403 for denied/missing projects
    await verify_project_access(project_id, user_id, user_email)

    # Resolve user info for the session metadata
    user_info_data = await get_user_info_by_id(user_id)

    # Fall back gracefully if Clerk API is unavailable
    if user_info_data:
        display_name = user_info_data["display_name"]
        avatar_url = user_info_data.get("avatar_url") or ""
    else:
        # Last-resort fallback: use email or user ID
        if not user_email:
            user_email = await get_user_email_by_id(user_id) or ""
        display_name = user_email or user_id
        avatar_url = ""

    color = get_cursor_color(user_id)

    # Issue the Liveblocks room token
    try:
        token_response = await authorize_user(
            room_id=room_id,
            user_id=user_id,
            user_info={
                "name": display_name,
                "avatar": avatar_url,
                "color": color,
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Liveblocks token request failed: {exc}",
        )

    return token_response
