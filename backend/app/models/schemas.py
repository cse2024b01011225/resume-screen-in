from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    message: str = Field(..., example="FastAPI Backend is active")
    database: str = Field(..., example="connected")
    python_version: str = Field(..., example="3.14.3")
    timestamp: datetime

class JobCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200, example="Python Backend Engineer")
    description: str = Field(..., min_length=10, example="Looking for a Python FastAPI developer with SQLite and REST API experience.")
    required_skills: Optional[List[str]] = Field(default_factory=list, example=["Python", "FastAPI", "SQLite", "REST APIs"])
    experience_level: Optional[str] = Field("Entry / Fresher", example="Entry / Fresher")
    is_fresher_friendly: Optional[bool] = Field(True, example=True)
    min_education: Optional[str] = Field("Bachelor's Degree", example="Bachelor's Degree")

class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    required_skills: List[str] = []
    experience_level: str = "All Levels"
    is_fresher_friendly: bool = True
    min_education: str = "Bachelor's Degree"
    candidate_count: int = 0
    shortlisted_count: int = 0
    created_at: str

class EvidenceSnippet(BaseModel):
    skill: str
    snippet: str
    section: Optional[str] = "General"

class ScoreBreakdown(BaseModel):
    technical_score: float = 0.0
    experience_project_score: float = 0.0
    education_score: float = 0.0
    overall_score: float = 0.0

class CandidateResponse(BaseModel):
    id: int
    job_id: int
    filename: str
    file_type: str
    candidate_name: str = "Unknown"
    candidate_email: str = ""
    candidate_phone: str = ""
    candidate_links: List[str] = []
    extracted_text_preview: str = ""
    match_score: float = 0.0
    score_breakdown: ScoreBreakdown
    matching_skills: List[str] = []
    missing_evidence: List[str] = []
    confirmed_gaps: List[str] = []
    evidence_snippets: List[EvidenceSnippet] = []
    fresher_highlights: List[str] = []
    explanation: str = ""
    is_shortlisted: bool = False
    created_at: str

class ShortlistUpdateRequest(BaseModel):
    is_shortlisted: bool

class StatsResponse(BaseModel):
    total_jobs: int
    total_resumes: int
    total_shortlisted: int
    avg_match_score: float
    recent_jobs: List[JobResponse]
