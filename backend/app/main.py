from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    PROJECT_NAME,
    PROJECT_SUBTITLE,
    DEVELOPER_NAME,
    PROJECT_CATEGORY,
    PROJECT_VERSION,
    ALLOWED_ORIGINS,
    API_PREFIX,
)
from app.database import init_db
from app.routers import health, jobs, candidates

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema on startup
    init_db()
    yield
    # Cleanup on shutdown if needed

app = FastAPI(
    title=PROJECT_NAME,
    version=PROJECT_VERSION,
    description="Backend API for Resume Screen-In - AI-Powered Resume Screening & Job Matching",
    lifespan=lifespan,
)

# CORS configuration to allow local frontend access (any localhost/127.0.0.1 port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(health.router, prefix=API_PREFIX)
app.include_router(jobs.router, prefix=API_PREFIX)
app.include_router(candidates.router, prefix=API_PREFIX)

@app.get("/")
def read_root():
    """Root endpoint for quick API discovery."""
    return {
        "service": PROJECT_NAME,
        "subtitle": PROJECT_SUBTITLE,
        "developer": DEVELOPER_NAME,
        "category": PROJECT_CATEGORY,
        "version": PROJECT_VERSION,
        "docs_url": "/docs",
        "health_check": f"{API_PREFIX}/health",
    }
