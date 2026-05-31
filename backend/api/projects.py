from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.models.project import Project, ProjectStatus
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


@router.patch("/{project_id}", response_model=ProjectOut)
async def rename_project(
    project_id: str, body: RenameProjectBody, user: CurrentUser
):
    """Rename a project. Only the owner may rename it."""
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

    if project.owner_id != user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden",
        )

    await project.delete()
