from datetime import datetime, timezone

from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class TaskRun(Document):
    """Tracks a Trigger.dev background job run and its ownership context."""

    run_id: str          # Trigger.dev run ID (e.g. "run_abc123")
    project_id: str      # Parent project MongoDB ObjectId as string
    user_id: str         # Clerk user ID of the initiator
    public_token: str    # Auto-generated Trigger.dev public access token
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "task_runs"
        indexes = [
            # Fast unique lookup by Trigger.dev run ID
            IndexModel([("run_id", ASCENDING)], unique=True),
            # Fast ownership / authorization queries
            IndexModel([("user_id", ASCENDING), ("project_id", ASCENDING)]),
        ]
