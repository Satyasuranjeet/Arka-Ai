from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.models.project import Project, ProjectCollaborator, ProjectStatus
from app.services.project_access import verify_project_access
from app.services.clerk_service import get_user_by_email, get_user_email_by_id
from middleware.clerk_auth import CurrentUser

router = APIRouter(prefix="/api/projects", tags=["projects"])


# ---------------------------------------------------------------------------
# Response model — serialises Beanie docs with plain `id` (not `_id`)
# ---------------------------------------------------------------------------

class ProjectOut(BaseModel):
    id: str
    owner_id: str
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    canvas_json_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_doc(cls, doc: Project) -> "ProjectOut":
        return cls(
            id=str(doc.id),
            owner_id=doc.owner_id,
            name=doc.name,
            description=doc.description,
            status=doc.status,
            canvas_json_path=doc.canvas_json_path,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
        )


# ---------------------------------------------------------------------------
# Request bodies
# ---------------------------------------------------------------------------

class CreateProjectBody(BaseModel):
    name: Optional[str] = None


class RenameProjectBody(BaseModel):
    name: str


class InviteCollaboratorBody(BaseModel):
    email: str


class CollaboratorOut(BaseModel):
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    added_at: datetime


# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------

async def _get_project_or_404(project_id: str) -> Project:
    try:
        oid = PydanticObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project = await Project.get(oid)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=list[ProjectOut])
async def list_projects(user: CurrentUser):
    """Return all projects owned by the authenticated user."""
    projects = await Project.find(Project.owner_id == user["sub"]).to_list()
    return [ProjectOut.from_doc(p) for p in projects]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ProjectOut)
async def create_project(body: CreateProjectBody, user: CurrentUser):
    """Create a new project for the authenticated user."""
    project = Project(
        owner_id=user["sub"],
        name=body.name or "Untitled Project",
    )
    await project.insert()
    return ProjectOut.from_doc(project)


# NOTE: All literal-path routes (/shared, /verify-access/…) must be declared
# before parameterised routes (/{project_id}) so FastAPI matches them first.

@router.get("/shared", response_model=list[ProjectOut])
async def list_shared_projects(user: CurrentUser):
    """Return projects the authenticated user has been invited to collaborate on."""
    user_id = user["sub"]
    user_email = user.get("email", "")

    # Resolve email via Clerk API when the JWT omits the email claim
    if not user_email:
        user_email = await get_user_email_by_id(user_id) or ""

    if not user_email:
        return []

    collabs = await ProjectCollaborator.find(
        ProjectCollaborator.collaborator_email == user_email
    ).to_list()

    if not collabs:
        return []

    results = []
    for collab in collabs:
        try:
            doc = await Project.get(PydanticObjectId(collab.project_id))
            if doc is not None:
                results.append(ProjectOut.from_doc(doc))
        except Exception:
            continue

    return results


@router.get("/verify-access/{project_id}", response_model=ProjectOut)
async def verify_access(project_id: str, user: CurrentUser):
    """
    Verify that the authenticated user has access to the given project.

    Returns the project data on success (200).
    Returns 401 if unauthenticated, 403 if access denied, 404 if not found.
    """
    user_id = user["sub"]
    # ``email`` claim is only present when the Clerk JWT template includes it.
    user_email = user.get("email", "")
    project = await verify_project_access(project_id, user_id, user_email)
    return ProjectOut.from_doc(project)


# ---------------------------------------------------------------------------
# Collaborator routes
# NOTE: /{project_id}/collaborators paths must be declared before the generic
# /{project_id} PATCH / DELETE routes (FastAPI matches in declaration order).
# ---------------------------------------------------------------------------

@router.get("/{project_id}/collaborators", response_model=list[CollaboratorOut])
async def list_collaborators(project_id: str, user: CurrentUser):
    """List collaborators for a project. Accessible by owner or any collaborator."""
    user_id = user["sub"]
    user_email = user.get("email", "")
    # Verify the requester has at least read access
    await verify_project_access(project_id, user_id, user_email)

    collabs = await ProjectCollaborator.find(
        ProjectCollaborator.project_id == project_id
    ).to_list()

    result = []
    for c in collabs:
        clerk_data = await get_user_by_email(c.collaborator_email)
        result.append(CollaboratorOut(
            email=c.collaborator_email,
            display_name=(clerk_data or {}).get("display_name", c.collaborator_email),
            avatar_url=(clerk_data or {}).get("avatar_url"),
            added_at=c.created_at,
        ))
    return result


@router.post(
    "/{project_id}/collaborators",
    status_code=status.HTTP_201_CREATED,
    response_model=CollaboratorOut,
)
async def invite_collaborator(
    project_id: str, body: InviteCollaboratorBody, user: CurrentUser
):
    """Invite a collaborator by email. Only the project owner may invite."""
    project = await _get_project_or_404(project_id)

    if project.owner_id != user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can invite collaborators",
        )

    # Idempotency: return 409 if already a collaborator
    existing = await ProjectCollaborator.find_one(
        ProjectCollaborator.project_id == project_id,
        ProjectCollaborator.collaborator_email == body.email,
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already a collaborator",
        )

    collab = ProjectCollaborator(
        project_id=project_id,
        collaborator_email=body.email,
    )
    await collab.insert()

    clerk_data = await get_user_by_email(body.email)
    return CollaboratorOut(
        email=body.email,
        display_name=(clerk_data or {}).get("display_name", body.email),
        avatar_url=(clerk_data or {}).get("avatar_url"),
        added_at=collab.created_at,
    )


@router.delete(
    "/{project_id}/collaborators/{email}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_collaborator(project_id: str, email: str, user: CurrentUser):
    """Remove a collaborator. Only the project owner may remove."""
    project = await _get_project_or_404(project_id)

    if project.owner_id != user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can remove collaborators",
        )

    collab = await ProjectCollaborator.find_one(
        ProjectCollaborator.project_id == project_id,
        ProjectCollaborator.collaborator_email == email,
    )
    if collab is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator not found",
        )

    await collab.delete()


@router.patch("/{project_id}", response_model=ProjectOut)
async def rename_project(
    project_id: str, body: RenameProjectBody, user: CurrentUser
):
    """Rename a project. Only the owner may rename it."""
    project = await _get_project_or_404(project_id)

    if project.owner_id != user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden",
        )

    project.name = body.name
    project.updated_at = datetime.now(timezone.utc)
    await project.save()
    return ProjectOut.from_doc(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, user: CurrentUser):
    """Delete a project. Only the owner may delete it."""
    project = await _get_project_or_404(project_id)

    if project.owner_id != user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden",
        )

    await project.delete()
