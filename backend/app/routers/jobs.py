import json
import sqlite3
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db_connection
from app.models.schemas import JobCreate, JobResponse, StatsResponse

router = APIRouter(prefix="", tags=["Job Requisitions"])

@router.post("/jobs", response_model=JobResponse, status_code=201)
def create_job(job_in: JobCreate):
    """Creates a new job requisition. Prevents identical accidental duplicates."""
    clean_title = job_in.title.strip()
    clean_desc = job_in.description.strip()
    clean_skills = sorted([s.strip().lower() for s in (job_in.required_skills or []) if s.strip()])

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Check for identical duplicate (exact same title, description, skills, and experience level)
        cursor.execute(
            """
            SELECT id, title, description, required_skills, experience_level
            FROM jobs
            WHERE LOWER(TRIM(title)) = LOWER(?)
            """,
            (clean_title,),
        )
        existing_matches = cursor.fetchall()
        for match in existing_matches:
            match_desc = (match["description"] or "").strip()
            match_skills = sorted([s.strip().lower() for s in json.loads(match["required_skills"] or "[]") if s.strip()])
            match_exp = (match["experience_level"] or "").strip().lower()
            incoming_exp = (job_in.experience_level or "").strip().lower()

            # Prevent duplicate only if all core requirements are identical
            if match_desc.lower() == clean_desc.lower() and match_skills == clean_skills and match_exp == incoming_exp:
                raise HTTPException(
                    status_code=409,
                    detail=f"An identical job requisition '{clean_title}' already exists (ID #{match['id']}). Duplicate submission prevented.",
                )

        skills_json = json.dumps(job_in.required_skills)
        cursor.execute(
            """
            INSERT INTO jobs (title, description, required_skills, experience_level, is_fresher_friendly, min_education)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                clean_title,
                clean_desc,
                skills_json,
                job_in.experience_level,
                1 if job_in.is_fresher_friendly else 0,
                job_in.min_education,
            ),
        )
        job_id = cursor.lastrowid
        conn.commit()

        cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        row = cursor.fetchone()

        return JobResponse(
            id=row["id"],
            title=row["title"],
            description=row["description"],
            required_skills=json.loads(row["required_skills"] or "[]"),
            experience_level=row["experience_level"] or "All Levels",
            is_fresher_friendly=bool(row["is_fresher_friendly"]),
            min_education=row["min_education"] or "Bachelor's Degree",
            candidate_count=0,
            shortlisted_count=0,
            created_at=str(row["created_at"]),
        )

@router.get("/jobs", response_model=List[JobResponse])
def list_jobs():
    """Lists all job requisitions with aggregate candidate counts."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT j.*,
                   COUNT(c.id) as candidate_count,
                   SUM(CASE WHEN c.is_shortlisted = 1 THEN 1 ELSE 0 END) as shortlisted_count
            FROM jobs j
            LEFT JOIN candidates c ON j.id = c.job_id
            GROUP BY j.id
            ORDER BY j.created_at DESC
        """)
        rows = cursor.fetchall()
        jobs = []
        for r in rows:
            jobs.append(
                JobResponse(
                    id=r["id"],
                    title=r["title"],
                    description=r["description"],
                    required_skills=json.loads(r["required_skills"] or "[]"),
                    experience_level=r["experience_level"] or "All Levels",
                    is_fresher_friendly=bool(r["is_fresher_friendly"]),
                    min_education=r["min_education"] or "Bachelor's Degree",
                    candidate_count=r["candidate_count"] or 0,
                    shortlisted_count=r["shortlisted_count"] or 0,
                    created_at=str(r["created_at"]),
                )
            )
        return jobs

@router.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: int):
    """Retrieves a single job requisition by ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT j.*,
                   COUNT(c.id) as candidate_count,
                   SUM(CASE WHEN c.is_shortlisted = 1 THEN 1 ELSE 0 END) as shortlisted_count
            FROM jobs j
            LEFT JOIN candidates c ON j.id = c.job_id
            WHERE j.id = ?
            GROUP BY j.id
        """, (job_id,))
        r = cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Job requisition not found")
            
        return JobResponse(
            id=r["id"],
            title=r["title"],
            description=r["description"],
            required_skills=json.loads(r["required_skills"] or "[]"),
            experience_level=r["experience_level"] or "All Levels",
            is_fresher_friendly=bool(r["is_fresher_friendly"]),
            min_education=r["min_education"] or "Bachelor's Degree",
            candidate_count=r["candidate_count"] or 0,
            shortlisted_count=r["shortlisted_count"] or 0,
            created_at=str(r["created_at"]),
        )

@router.delete("/jobs/{job_id}", status_code=200)
def delete_job(job_id: int, force: bool = False):
    """
    Deletes a job requisition safely.
    If the job has screening history (evaluated candidates) and force is False,
    deletion is rejected to protect candidate screening data.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Check job existence
        cursor.execute("SELECT id, title FROM jobs WHERE id = ?", (job_id,))
        job_row = cursor.fetchone()
        if not job_row:
            raise HTTPException(status_code=404, detail="Job requisition not found")

        job_title = job_row["title"]

        # Check candidate screening history for this specific job
        cursor.execute("SELECT COUNT(*) FROM candidates WHERE job_id = ?", (job_id,))
        candidate_count = cursor.fetchone()[0]

        if candidate_count > 0 and not force:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Job '{job_title}' has {candidate_count} active candidate screening record(s). "
                    "Deletion was blocked to protect screening history. "
                    "Please confirm deletion with force=true to proceed with removing this job and its candidate records."
                ),
            )

        # Delete only candidate records linked to this job
        cursor.execute("DELETE FROM candidates WHERE job_id = ?", (job_id,))
        # Delete the job requisition itself
        cursor.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        conn.commit()

    return {
        "message": f"Job requisition '{job_title}' deleted successfully",
        "id": job_id,
        "deleted_candidates_count": candidate_count,
    }

@router.get("/stats", response_model=StatsResponse)
def get_stats():
    """Returns top-level dashboard metrics across all jobs and candidates."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM jobs")
        total_jobs = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM candidates")
        total_resumes = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM candidates WHERE is_shortlisted = 1")
        total_shortlisted = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(match_score) FROM candidates")
        avg_score_raw = cursor.fetchone()[0]
        avg_match_score = round(float(avg_score_raw), 1) if avg_score_raw is not None else 0.0
        
        # Recent jobs
        cursor.execute("""
            SELECT j.*,
                   COUNT(c.id) as candidate_count,
                   SUM(CASE WHEN c.is_shortlisted = 1 THEN 1 ELSE 0 END) as shortlisted_count
            FROM jobs j
            LEFT JOIN candidates c ON j.id = c.job_id
            GROUP BY j.id
            ORDER BY j.created_at DESC
            LIMIT 5
        """)
        rows = cursor.fetchall()
        recent_jobs = [
            JobResponse(
                id=r["id"],
                title=r["title"],
                description=r["description"],
                required_skills=json.loads(r["required_skills"] or "[]"),
                experience_level=r["experience_level"] or "All Levels",
                is_fresher_friendly=bool(r["is_fresher_friendly"]),
                min_education=r["min_education"] or "Bachelor's Degree",
                candidate_count=r["candidate_count"] or 0,
                shortlisted_count=r["shortlisted_count"] or 0,
                created_at=str(r["created_at"]),
            )
            for r in rows
        ]
        
        return StatsResponse(
            total_jobs=total_jobs,
            total_resumes=total_resumes,
            total_shortlisted=total_shortlisted,
            avg_match_score=avg_match_score,
            recent_jobs=recent_jobs,
        )
