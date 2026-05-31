"""
Clerk JWT verification dependency for FastAPI.

Usage:
    from backend.middleware.clerk_auth import require_auth, CurrentUser

    @router.get("/projects")
    async def list_projects(user: CurrentUser):
        return {"user_id": user["sub"]}
"""

import os
from functools import lru_cache
from typing import Annotated

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _get_jwks_client() -> jwt.PyJWKClient:
    """Return a cached JWKS client pointed at Clerk's public key endpoint."""
    issuer = os.environ["CLERK_ISSUER"].rstrip("/")
    jwks_url = f"{issuer}/.well-known/jwks.json"
    return jwt.PyJWKClient(jwks_url, cache_keys=True)


def _verify_token(token: str) -> dict:
    """Decode and verify a Clerk-issued JWT, returning the payload."""
    issuer = os.environ["CLERK_ISSUER"].rstrip("/")
    client = _get_jwks_client()

    try:
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False},
            leeway=60,  # tolerate up to 60 s of clock skew (covers iat/nbf drift)
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


async def require_auth(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> dict:
    """FastAPI dependency that extracts and verifies the Clerk JWT from the
    Authorization header. Returns the decoded JWT payload on success.

    Raises HTTP 401 if the token is missing, expired, or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _verify_token(credentials.credentials)


# Convenient type alias for route handlers
CurrentUser = Annotated[dict, Depends(require_auth)]
