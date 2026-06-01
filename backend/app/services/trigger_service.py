"""
Trigger.dev service — fire background tasks via the Trigger.dev Management API.

Usage:
    from app.services.trigger_service import trigger_task

    run = await trigger_task(
        task_id="analyze-canvas",
        payload={"projectId": "...", "nodes": [...], "edges": [...]},
    )
    # run["id"] is the Trigger.dev run ID — poll or use webhooks for results
"""

import os
import logging
from datetime import datetime, timezone, timedelta
import json

import httpx
import jwt

logger = logging.getLogger(__name__)

# Trigger.dev Management API base path.
# Note: v3 path returns 404 for task trigger in current cloud API; use v1.
_TRIGGER_API_BASE = "https://api.trigger.dev/api/v1"
_JWT_ISSUER = "https://id.trigger.dev"
_JWT_AUDIENCE = "https://api.trigger.dev"


def _secret_key() -> str:
    key = os.environ.get("TRIGGER_SECRET_KEY", "")
    if not key:
        raise RuntimeError(
            "TRIGGER_SECRET_KEY is not set. "
            "Get it from https://cloud.trigger.dev → Project → API Keys."
        )
    return key


def _generate_public_access_token(run_id: str, claims: dict | None = None) -> str:
    """Create a Trigger-compatible run access token.

    The Trigger SDK signs run tokens locally when the API response does not
    return an x-trigger-jwt header. We mirror that behavior here so backend
    callers always get a usable public token.
    """
    now = datetime.now(timezone.utc)
    exp_delta = timedelta(hours=1)

    payload = {
        **(claims or {}),
        "scopes": [f"read:runs:{run_id}"],
        "iat": int(now.timestamp()),
        "exp": int((now + exp_delta).timestamp()),
        "iss": _JWT_ISSUER,
        "aud": _JWT_AUDIENCE,
    }

    return jwt.encode(
        payload,
        _secret_key(),
        algorithm="HS256",
        headers={"alg": "HS256"},
    )


async def trigger_task(task_id: str, payload: dict) -> dict:
    """
    Trigger a Trigger.dev background task and return the run object.

    Args:
        task_id: The task ``id`` string defined in the trigger/ folder
                 (e.g. ``"analyze-canvas"`` or ``"hello-world"``).
        payload: Arbitrary JSON-serialisable dict passed as the run payload.

    Returns:
        The Trigger.dev run object, e.g.::

            {
                "id": "run_abc123",
                "status": "QUEUED",
                "taskIdentifier": "analyze-canvas",
                ...
            }

    Raises:
        httpx.HTTPStatusError: on non-2xx response from Trigger.dev API.
        RuntimeError: if TRIGGER_SECRET_KEY is not configured.
    """
    url = f"{_TRIGGER_API_BASE}/tasks/{task_id}/trigger"
    headers = {
        "Authorization": f"Bearer {_secret_key()}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json={"payload": payload}, headers=headers)

    if not resp.is_success:
        logger.error(
            "Trigger.dev API error: status=%s body=%s",
            resp.status_code,
            resp.text[:500],
        )
        resp.raise_for_status()

    data = resp.json()

    public_token = resp.headers.get("x-trigger-jwt")
    if not public_token:
        claims_header = resp.headers.get("x-trigger-jwt-claims")
        claims = None
        if claims_header:
            try:
                claims = json.loads(claims_header)
            except Exception:
                claims = None

        public_token = _generate_public_access_token(data["id"], claims=claims)

    data["publicAccessToken"] = public_token
    return data


async def get_run(run_id: str) -> dict:
    """
    Fetch the current state of a Trigger.dev run by its run ID.

    Returns the run object including ``status``, ``output``, etc.
    """
    url = f"{_TRIGGER_API_BASE}/runs/{run_id}"
    headers = {"Authorization": f"Bearer {_secret_key()}"}

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, headers=headers)

    resp.raise_for_status()
    return resp.json()
