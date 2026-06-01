import os
from datetime import datetime, timezone
from typing import Optional, Any

import httpx
from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.models.project import Project, ProjectCollaborator, ProjectStatus
from app.models.project_spec import ProjectSpec
from app.services.project_access import verify_project_access
from app.services.clerk_service import get_user_by_email, get_user_email_by_id
from app.services.trigger_service import trigger_task, get_run
from middleware.clerk_auth import CurrentUser
from fastapi.responses import StreamingResponse
from bson import ObjectId

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


class CanvasSaveBody(BaseModel):
    nodes: list[Any] = []
    edges: list[Any] = []


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


# ---------------------------------------------------------------------------
# Canvas save / load routes
# NOTE: declared after /{project_id} PATCH/DELETE to avoid path conflicts.
# Canvas JSON is stored directly on the Project document in MongoDB —
# no blob storage involved, so no "advanced operation" quota is consumed.
# ---------------------------------------------------------------------------


@router.put("/{project_id}/canvas", status_code=status.HTTP_200_OK)
async def save_canvas(project_id: str, body: CanvasSaveBody, user: CurrentUser):
    """
    Persist the canvas JSON (nodes + edges) on the Project document in MongoDB.
    Write access is required (owner or collaborator).
    """
    user_id = user["sub"]
    user_email = user.get("email", "")
    await verify_project_access(project_id, user_id, user_email)

    project = await _get_project_or_404(project_id)
    project.canvas_data = {"nodes": body.nodes, "edges": body.edges}
    project.updated_at = datetime.now(timezone.utc)
    await project.save()

    return {"ok": True}


@router.get("/{project_id}/canvas")
async def load_canvas(project_id: str, user: CurrentUser):
    """
    Return the saved canvas JSON for a project.
    Read access is required (owner or collaborator).
    """
    user_id = user["sub"]
    user_email = user.get("email", "")
    await verify_project_access(project_id, user_id, user_email)

    project = await _get_project_or_404(project_id)

    # canvas_data is the new primary storage path
    if project.canvas_data:
        return {
            "nodes": project.canvas_data.get("nodes", []),
            "edges": project.canvas_data.get("edges", []),
        }

    # Fallback: migrate data from legacy Vercel Blob URL if it exists
    if project.canvas_blob_url:
        try:
            token = os.environ.get("BLOB_READ_WRITE_TOKEN", "") or os.environ.get("VERCEL_BLOB_TOKEN", "")
            if token:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        project.canvas_blob_url,
                        headers={"authorization": f"Bearer {token}"},
                    )
                if resp.status_code == 200:
                    data = resp.json()
                    canvas = {"nodes": data.get("nodes", []), "edges": data.get("edges", [])}
                    # Migrate to MongoDB so we don't hit blob again
                    project.canvas_data = canvas
                    project.canvas_blob_url = None
                    await project.save()
                    return canvas
        except Exception:
            pass

    return {"nodes": [], "edges": []}


# ---------------------------------------------------------------------------
# Specs persistence and download
# ---------------------------------------------------------------------------


@router.get("/{project_id}/specs")
async def list_specs(project_id: str, user: CurrentUser):
    """Return metadata for all specs belonging to a project.

    Access is verified — only owners or collaborators may list specs.
    """
    user_id = user["sub"]
    user_email = user.get("email", "")
    await verify_project_access(project_id, user_id, user_email)

    specs = (
        await ProjectSpec.find(ProjectSpec.project_id == project_id)
        .sort(-ProjectSpec.created_at)
        .to_list()
    )

    return [
        {
            "specId": str(spec.id),
            "created_at": spec.created_at.isoformat(),
            "filename": f"spec-{spec.created_at.strftime('%Y-%m-%d-%H%M%S')}.md",
        }
        for spec in specs
    ]


@router.get("/{project_id}/specs/{spec_id}/download")
async def download_spec(project_id: str, spec_id: str, user: CurrentUser):
    """
    Download a generated spec Markdown file as an attachment.

    Access is verified via `verify_project_access` — only owners or collaborators
    may download specs for the project.
    """
    user_id = user["sub"]
    user_email = user.get("email", "")
    await verify_project_access(project_id, user_id, user_email)

    # Validate spec_id as an ObjectId where applicable, otherwise fall back to string lookup
    spec = None
    try:
        oid = ObjectId(spec_id)
        spec = await ProjectSpec.get(oid)
    except Exception:
        # try as string id field
        spec = await ProjectSpec.find_one(ProjectSpec.id == spec_id)

    if spec is None or spec.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spec not found")

    # Stream the markdown content as a downloadable attachment
    content_bytes = spec.content.encode("utf-8")
    headers = {"Content-Disposition": "attachment; filename=spec.md"}
    return StreamingResponse(iter([content_bytes]), media_type="text/markdown", headers=headers)


class CreateSpecBody(BaseModel):
    content: str


@router.post("/{project_id}/specs", status_code=status.HTTP_201_CREATED)
async def create_spec(project_id: str, body: CreateSpecBody, user: CurrentUser):
    """Create and persist a generated spec for the given project.

    This endpoint requires the requester to have write access to the project
    (owner or collaborator). Returns the created spec id.
    """
    user_id = user["sub"]
    user_email = user.get("email", "")
    await verify_project_access(project_id, user_id, user_email)

    spec = ProjectSpec(project_id=project_id, content=body.content)
    await spec.insert()
    return {"specId": str(spec.id)}


# ---------------------------------------------------------------------------
# Trigger.dev — background AI tasks
# ---------------------------------------------------------------------------


@router.post("/{project_id}/canvas/analyze", status_code=status.HTTP_202_ACCEPTED)
async def trigger_canvas_analysis(project_id: str, user: CurrentUser):
    """
    Queue an AI analysis of the current canvas in the background via Trigger.dev.

    Returns immediately with a run ID.  Poll ``GET /api/projects/{id}/runs/{run_id}``
    to check progress and retrieve the result when status is ``COMPLETED``.
    """
    user_id = user["sub"]
    user_email = user.get("email", "")
    await verify_project_access(project_id, user_id, user_email)

    project = await _get_project_or_404(project_id)
    canvas = project.canvas_data or {"nodes": [], "edges": []}

    run = await trigger_task(
        task_id="analyze-canvas",
        payload={
            "projectId": project_id,
            "projectName": project.name,
            "nodes": canvas.get("nodes", []),
            "edges": canvas.get("edges", []),
        },
    )

    return {"runId": run.get("id"), "status": run.get("status", "QUEUED")}


@router.get("/{project_id}/runs/{run_id}")
async def get_task_run(project_id: str, run_id: str, user: CurrentUser):
    """
    Poll the status of a Trigger.dev run.

    Returns the run object including ``status`` and ``output`` when complete.
    Possible statuses: QUEUED, EXECUTING, COMPLETED, FAILED, CANCELLED.
    """
    user_id = user["sub"]
    user_email = user.get("email", "")
    # Verify the user still has access to this project before exposing run data
    await verify_project_access(project_id, user_id, user_email)

    run = await get_run(run_id)
    return run
