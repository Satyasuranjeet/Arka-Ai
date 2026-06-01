"""MongoDB Motor client singleton and Beanie initialization.

The Motor client is created once per process and reused across all requests,
preventing connection leaks during development hot reloads.
"""

import os

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from beanie import init_beanie

from app.models.project import Project, ProjectCollaborator
from app.models.task_run import TaskRun
from app.models.project_spec import ProjectSpec

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    """Return the cached Motor client, creating it on first call."""
    global _client
    if _client is None:
        uri = os.environ["MONGODB_URI"]
        _client = AsyncIOMotorClient(uri, server_api=ServerApi("1"))
    return _client


async def init_db() -> None:
    """Initialize Beanie with all document models.

    Beanie calls `create_indexes()` for each model, applying unique
    constraints and building the required indexes against the Atlas cluster.
    """
    client = get_client()
    db_name = os.environ.get("MONGODB_DB", "mydb")
    await init_beanie(
        database=client[db_name],
        document_models=[Project, ProjectCollaborator, TaskRun, ProjectSpec],
    )
