import sqlite3
import json
from typing import Generator
from app.config import DATABASE_PATH

def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection configured with Row factory for dict-like access."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    """Initializes and migrates the database schema."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                required_skills TEXT DEFAULT '[]',
                experience_level TEXT DEFAULT 'All Levels',
                is_fresher_friendly INTEGER DEFAULT 1,
                min_education TEXT DEFAULT 'Bachelor''s Degree',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Auto-migrate any missing columns in jobs table
        cursor.execute("PRAGMA table_info(jobs)")
        existing_job_cols = {col["name"] for col in cursor.fetchall()}
        
        job_cols_to_add = {
            "required_skills": "TEXT DEFAULT '[]'",
            "experience_level": "TEXT DEFAULT 'All Levels'",
            "is_fresher_friendly": "INTEGER DEFAULT 1",
            "min_education": "TEXT DEFAULT 'Bachelor''s Degree'",
        }
        for col_name, col_def in job_cols_to_add.items():
            if col_name not in existing_job_cols:
                cursor.execute(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_def}")
        
        # 2. Resumes / Candidates table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                candidate_name TEXT DEFAULT 'Unknown',
                candidate_email TEXT DEFAULT '',
                candidate_phone TEXT DEFAULT '',
                candidate_links TEXT DEFAULT '[]',
                extracted_text TEXT DEFAULT '',
                match_score REAL DEFAULT 0.0,
                score_breakdown TEXT DEFAULT '{}',
                matching_skills TEXT DEFAULT '[]',
                missing_evidence TEXT DEFAULT '[]',
                confirmed_gaps TEXT DEFAULT '[]',
                evidence_snippets TEXT DEFAULT '[]',
                fresher_highlights TEXT DEFAULT '[]',
                explanation TEXT DEFAULT '',
                is_shortlisted BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
            )
        """)
        
        # Auto-migrate any missing columns in candidates table
        cursor.execute("PRAGMA table_info(candidates)")
        existing_cand_cols = {col["name"] for col in cursor.fetchall()}
        
        cand_cols_to_add = {
            "candidate_phone": "TEXT DEFAULT ''",
            "candidate_links": "TEXT DEFAULT '[]'",
            "score_breakdown": "TEXT DEFAULT '{}'",
            "matching_skills": "TEXT DEFAULT '[]'",
            "missing_evidence": "TEXT DEFAULT '[]'",
            "confirmed_gaps": "TEXT DEFAULT '[]'",
            "evidence_snippets": "TEXT DEFAULT '[]'",
            "fresher_highlights": "TEXT DEFAULT '[]'",
        }
        for col_name, col_def in cand_cols_to_add.items():
            if col_name not in existing_cand_cols:
                cursor.execute(f"ALTER TABLE candidates ADD COLUMN {col_name} {col_def}")
                
        conn.commit()

def check_db_health() -> bool:
    """Checks if the SQLite database is reachable and writable."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
            return row is not None and row[0] == 1
    except Exception:
        return False

# Ensure database schema is initialized and migrated on import
init_db()
