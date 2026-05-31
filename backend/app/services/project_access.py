"""
Access verification service for project workspace routes.

Checks whether a given user (identified by Clerk user ID and primary email)
has access to a project — either as the owner or as an invited collaborator.
"""

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models.project import Project, ProjectCollaborator
from app.services.clerk_service import get_user_email_by_id


async def verify_project_access(
    project_id: str,
    user_id: str,
    user_email: str,
) -> Project:
    """
    Return the project document if the user has access.

    Access is granted when:
    - The resolved user ID matches the project's ``owner_id``, OR
    - A ``ProjectCollaborator`` record links the project to the user's email.

    If ``user_email`` is absent from the JWT (Clerk template does not include
    it), the email is resolved via the Clerk Backend API using ``user_id``.

    Raises:
        HTTP 404 — project not found or invalid ID.
        HTTP 403 — project exists but user has no access.
    """
    # Validate ObjectId format
    try:
        oid = PydanticObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    project = await Project.get(oid)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Owner check
    if project.owner_id == user_id:
        return project

    # Resolve email if the JWT did not carry it
    resolved_email = user_email
    if not resolved_email:
        resolved_email = await get_user_email_by_id(user_id) or ""

    # Collaborator check
    if resolved_email:
        collab = await ProjectCollaborator.find_one(
            ProjectCollaborator.project_id == project_id,
            ProjectCollaborator.collaborator_email == resolved_email,
        )
        if collab is not None:
            return project

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied",
    )

    """
    Return the project document if the user has access.

    Access is granted when:
    - The resolved user ID matches the project's ``owner_id``, OR
    - A ``ProjectCollaborator`` record links the project to the user's email.

    Raises:
        HTTP 404 — project not found or invalid ID.
        HTTP 403 — project exists but user has no access.

    Note: ``user_email`` is extracted from the Clerk JWT ``email`` claim.
    This claim is only present when the Clerk JWT template is configured to
    include it. If the claim is absent the collaborator check is skipped and
    only owner access is evaluated.
    """
    # Validate ObjectId format
    try:
        oid = PydanticObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    project = await Project.get(oid)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Owner check
    if project.owner_id == user_id:
        return project

    # Collaborator check (requires email claim in JWT)
    if user_email:
        collab = await ProjectCollaborator.find_one(
            ProjectCollaborator.project_id == project_id,
            ProjectCollaborator.collaborator_email == user_email,
        )
        if collab is not None:
            return project

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied",
    )
