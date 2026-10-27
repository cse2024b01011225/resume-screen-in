import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATABASE_PATH = DATA_DIR / "resume_screening.db"

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Application metadata
PROJECT_NAME = "Resume Screen-In"
PROJECT_SUBTITLE = "AI-Powered Resume Screening & Job Matching"
DEVELOPER_NAME = "Yash Tomar"
PROJECT_CATEGORY = "HCL Capstone Project"
PROJECT_VERSION = "0.1.0"
API_PREFIX = "/api"

# CORS configuration: Allow frontend development server
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
