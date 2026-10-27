import platform
from datetime import datetime, timezone
from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.database import check_db_health

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("", response_model=HealthResponse)
def get_health_status() -> HealthResponse:
    """Returns the operational status of the FastAPI backend and SQLite database."""
    db_ok = check_db_health()
    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        message="FastAPI Backend is operational and ready.",
        database="connected" if db_ok else "disconnected",
        python_version=platform.python_version(),
        timestamp=datetime.now(timezone.utc),
    )
