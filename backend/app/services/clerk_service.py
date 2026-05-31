"""
Clerk Backend API helpers.

Uses the Clerk REST API (https://api.clerk.com/v1) to enrich
collaborator records with display name and avatar image.
This is the same API the ``clerk-backend-api`` SDK wraps.
"""

import os
from typing import Optional

import httpx


async def get_user_email_by_id(user_id: str) -> Optional[str]:
    """
    Return the primary email address for a Clerk user given their user ID.

    Used to resolve collaborator access when the JWT does not carry an
    ``email`` claim (i.e. the Clerk JWT template omits it).
    Returns ``None`` on any failure.
    """
    secret_key = os.environ.get("CLERK_SECRET_KEY", "")
    if not secret_key:
        return None

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={"Authorization": f"Bearer {secret_key}"},
            )

        if resp.status_code != 200:
            return None

        user = resp.json()
        primary_id = user.get("primary_email_address_id")
        for email_obj in user.get("email_addresses", []):
            if email_obj.get("id") == primary_id:
                return email_obj.get("email_address")
        # fallback: return the first email if no primary is flagged
        emails = user.get("email_addresses", [])
        if emails:
            return emails[0].get("email_address")
        return None

    except Exception:
        return None


async def get_user_by_email(email: str) -> Optional[dict]:
    """
    Look up a Clerk user by email address.

    Returns a dict with ``display_name`` and ``avatar_url`` keys on success,
    or ``None`` when no matching user exists or the request fails.
    """
    secret_key = os.environ.get("CLERK_SECRET_KEY", "")
    if not secret_key:
        return None

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://api.clerk.com/v1/users",
                params={"email_address": email, "limit": 1},
                headers={"Authorization": f"Bearer {secret_key}"},
            )

        if resp.status_code != 200:
            return None

        users = resp.json()
        if not users:
            return None

        user = users[0]
        first = user.get("first_name") or ""
        last = user.get("last_name") or ""
        display_name = (
            f"{first} {last}".strip()
            or user.get("username")
            or email
        )
        return {
            "display_name": display_name,
            "avatar_url": user.get("image_url"),
        }

    except Exception:
        return None

    """
    Look up a Clerk user by email address.

    Returns a dict with ``display_name`` and ``avatar_url`` keys on success,
    or ``None`` when no matching user exists or the request fails.
    """
    secret_key = os.environ.get("CLERK_SECRET_KEY", "")
    if not secret_key:
        return None

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://api.clerk.com/v1/users",
                params={"email_address": email, "limit": 1},
                headers={"Authorization": f"Bearer {secret_key}"},
            )

        if resp.status_code != 200:
            return None

        users = resp.json()
        if not users:
            return None

        user = users[0]
        first = user.get("first_name") or ""
        last = user.get("last_name") or ""
        display_name = (
            f"{first} {last}".strip()
            or user.get("username")
            or email
        )
        return {
            "display_name": display_name,
            "avatar_url": user.get("image_url"),
        }

    except Exception:
        return None
