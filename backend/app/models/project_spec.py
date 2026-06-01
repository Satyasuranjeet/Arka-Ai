from datetime import datetime, timezone

from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class ProjectSpec(Document):
    """Persisted AI-generated specification documents linked to a project.

    Fields:
      - project_id: string id of the parent Project document
      - content: raw Markdown text of the spec
      - created_at: timestamp
    """

    project_id: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "project_specs"
        indexes = [
            IndexModel([("project_id", ASCENDING)]),
            IndexModel([("created_at", ASCENDING)]),
        ]
