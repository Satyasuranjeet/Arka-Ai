from enum import Enum
from typing import Optional
from datetime import datetime, timezone

from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class ProjectStatus(str, Enum):
    DRAFT = "DRAFT"
    ARCHIVED = "ARCHIVED"


class Project(Document):
    owner_id: str  # Clerk user ID
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.DRAFT
    canvas_json_path: Optional[str] = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "projects"
        indexes = [
            IndexModel([("owner_id", ASCENDING)]),
            IndexModel([("created_at", ASCENDING)]),
        ]


class ProjectCollaborator(Document):
    project_id: str  # References Project id
    collaborator_email: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "project_collaborators"
        indexes = [
            IndexModel(
                [("project_id", ASCENDING), ("collaborator_email", ASCENDING)],
                unique=True,
            ),
            IndexModel([("collaborator_email", ASCENDING)]),
            IndexModel([("project_id", ASCENDING), ("created_at", ASCENDING)]),
        ]
