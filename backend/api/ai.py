"""
AI task routes.

POST /api/ai/design        — trigger a background design generation run
POST /api/ai/design/token  — return a run-scoped public access token after
                             verifying the caller owns the run
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from app.services.project_access import verify_project_access
from app.models.task_run import TaskRun
from app.services.trigger_service import trigger_task
from middleware.clerk_auth import CurrentUser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])
_ROOM_PREFIX = "project-"


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class DesignRequest(BaseModel):
    prompt: str
    room_id: str = Field(alias="roomId")
    project_id: str = Field(alias="projectId")

    model_config = ConfigDict(populate_by_name=True)


class TokenRequest(BaseModel):
    run_id: str = Field(alias="runId")

    model_config = ConfigDict(populate_by_name=True)


class SpecRequest(BaseModel):
    room_id: str = Field(alias="roomId")
    chat_history: list[dict[str, Any]] = Field(default_factory=list, alias="chatHistory")
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


def _project_id_from_room(room_id: str) -> str:
    if not room_id.startswith(_ROOM_PREFIX):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid room id. Expected '{_ROOM_PREFIX}{{projectId}}'.",
        )
    project_id = room_id[len(_ROOM_PREFIX):].strip()
    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid room id.",
        )
    return project_id


def _utc_created_at(value: datetime | None) -> datetime:
    """Normalize a stored timestamp to an aware UTC datetime.

    Older task_run documents may have naive datetimes or a missing created_at
    field. We treat those as UTC so the token window check cannot crash.
    """
    if value is None:
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/design", status_code=status.HTTP_202_ACCEPTED)
async def trigger_design(body: DesignRequest, user: CurrentUser):
    """
    Trigger the ``design-agent`` background task on Trigger.dev.

    - Authenticates via Clerk JWT bearer token.
    - Fires the task with the provided prompt and room context.
    - Persists a ``TaskRun`` tracking document in MongoDB.
    - Returns the Trigger.dev run ID for the client to use when requesting a
      public token.
    """
    user_id = user["sub"]
    user_email = user.get("email", "")
    await verify_project_access(body.project_id, user_id, user_email)

    try:
        run = await trigger_task(
            task_id="design-agent",
            payload={
                "prompt": body.prompt,
                "room_id": body.room_id,
                "project_id": body.project_id,
            },
        )
    except RuntimeError as exc:
        logger.error("Trigger.dev config error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except httpx.HTTPStatusError as exc:
        logger.error("Trigger.dev request failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to trigger background task.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error while triggering design task")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while starting design run.",
        ) from exc

    run_id: str = run.get("id", "")
    # Trigger.dev automatically attaches a scoped public access token to every
    # trigger response — capture it so we can return it securely later.
    public_token: str = run.get("publicAccessToken", "")

    if not run_id:
        logger.error("Trigger.dev returned no run ID: %s", run)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Trigger.dev did not return a run ID.",
        )

    task_run = TaskRun(
        run_id=run_id,
        project_id=body.project_id,
        user_id=user_id,
        public_token=public_token,
    )
    await task_run.insert()

    logger.info("Design run started: run_id=%s project_id=%s", run_id, body.project_id)

    return {"run_id": run_id, "public_token": public_token}


@router.post("/design/token")
async def get_design_token(body: TokenRequest, user: CurrentUser):
    """
    Return the run-scoped Trigger.dev public access token for a given run.

    Verifies that the calling user is the original initiator of the run before
    issuing the token — prevents run ID enumeration by other users.

    The returned ``public_token`` can be passed directly to
    ``@trigger.dev/react-hooks`` on the frontend to subscribe to real-time
    run updates without routing every poll through this backend.
    """
    task_run = await TaskRun.find_one(TaskRun.run_id == body.run_id)

    if task_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found.",
        )

    if task_run.user_id != user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this run.",
        )

    return {"public_token": task_run.public_token}


@router.post("/spec", status_code=status.HTTP_202_ACCEPTED)
async def trigger_spec_generation(body: SpecRequest, user: CurrentUser):
    """Trigger the `generate-spec` task for a room-scoped project.

    Security model:
    - `project_id` is derived server-side from `room_id` only.
    - Caller must be owner/collaborator on that derived project.
    - A task-run ownership record is persisted for token checks.
    """
    project_id = _project_id_from_room(body.room_id)
    user_id = user["sub"]
    user_email = user.get("email", "")
    await verify_project_access(project_id, user_id, user_email)

    try:
        run = await trigger_task(
            task_id="generate-spec",
            payload={
                "project_id": project_id,
                "room_id": body.room_id,
                "chatHistory": body.chat_history,
                "nodes": body.nodes,
                "edges": body.edges,
            },
        )
    except RuntimeError as exc:
        logger.error("Trigger.dev config error for spec task: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except httpx.HTTPStatusError as exc:
        logger.error("Trigger.dev request failed for spec task: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to trigger spec generation task.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error while triggering spec generation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while starting spec generation run.",
        ) from exc

    run_id: str = run.get("id", "")
    public_token: str = run.get("publicAccessToken", "")

    if not run_id:
        logger.error("Trigger.dev returned no run ID for spec task: %s", run)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Trigger.dev did not return a run ID.",
        )

    await TaskRun(
        run_id=run_id,
        project_id=project_id,
        user_id=user_id,
        public_token=public_token,
    ).insert()

    return {"run_id": run_id, "public_token": public_token}


@router.post("/spec/token")
async def get_spec_token(body: TokenRequest, user: CurrentUser):
    """Return a run-scoped token only to the owner of the run.

    Enforces a one-hour validity window for token retrieval from this endpoint.
    """
    task_run = await TaskRun.find_one(TaskRun.run_id == body.run_id)

    if task_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found.",
        )

    if task_run.user_id != user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this run.",
        )

    age = datetime.now(timezone.utc) - _utc_created_at(task_run.created_at)
    if age > timedelta(hours=1):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Run token retrieval window expired.",
        )

    return {
        "public_token": task_run.public_token,
        "expires_in_seconds": max(0, int((timedelta(hours=1) - age).total_seconds())),
    }
