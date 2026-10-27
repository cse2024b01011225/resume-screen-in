import io
import csv
import json
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse

from app.database import get_db_connection
from app.models.schemas import (
    CandidateResponse,
    ScoreBreakdown,
    EvidenceSnippet,
    ShortlistUpdateRequest,
)
from app.services.parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_candidate_entities,
)
from app.services.matcher import evaluate_resume_match

router = APIRouter(prefix="", tags=["Candidates & Resume Screening"])

def parse_candidate_row(r) -> CandidateResponse:
    """Helper to convert a SQLite candidate row into a CandidateResponse object."""
    score_breakdown_raw = json.loads(r["score_breakdown"] or "{}")
    breakdown = ScoreBreakdown(
        technical_score=score_breakdown_raw.get("technical_score", 0.0),
        experience_project_score=score_breakdown_raw.get("experience_project_score", 0.0),
        education_score=score_breakdown_raw.get("education_score", 0.0),
        overall_score=score_breakdown_raw.get("overall_score", r["match_score"] or 0.0),
    )
    
    evidence_raw = json.loads(r["evidence_snippets"] or "[]")
    evidence_snippets = [
        EvidenceSnippet(
            skill=item.get("skill", ""),
            snippet=item.get("snippet", ""),
            section=item.get("section", "General"),
        )
        for item in evidence_raw
    ]
    
    text_content = r["extracted_text"] or ""
    preview = text_content[:400] + ("..." if len(text_content) > 400 else "")

    return CandidateResponse(
        id=r["id"],
        job_id=r["job_id"],
        filename=r["filename"],
        file_type=r["file_type"],
        candidate_name=r["candidate_name"] or "Unknown",
        candidate_email=r["candidate_email"] or "",
        candidate_phone=r["candidate_phone"] or "",
        candidate_links=json.loads(r["candidate_links"] or "[]"),
        extracted_text_preview=preview,
        match_score=r["match_score"] or 0.0,
        score_breakdown=breakdown,
        matching_skills=json.loads(r["matching_skills"] or "[]"),
        missing_evidence=json.loads(r["missing_evidence"] or "[]"),
        confirmed_gaps=json.loads(r["confirmed_gaps"] or "[]"),
        evidence_snippets=evidence_snippets,
        fresher_highlights=json.loads(r["fresher_highlights"] or "[]"),
        explanation=r["explanation"] or "",
        is_shortlisted=bool(r["is_shortlisted"]),
        created_at=str(r["created_at"]),
    )

@router.post("/jobs/{job_id}/resumes", response_model=List[CandidateResponse])
async def upload_and_screen_resumes(
    job_id: int,
    files: List[UploadFile] = File(...),
):
    """
    Ingests multiple resume files (.pdf, .docx), extracts text, evaluates job-specific match,
    and stores candidate analysis in SQLite.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        job_row = cursor.fetchone()
        if not job_row:
            raise HTTPException(status_code=404, detail="Target job requisition not found")
            
        job_title = job_row["title"]
        job_desc = job_row["description"]
        req_skills = json.loads(job_row["required_skills"] or "[]")
        exp_level = job_row["experience_level"] or "Entry / Fresher"
        is_fresher_friendly = bool(job_row["is_fresher_friendly"])
        min_edu = job_row["min_education"] or "Bachelor's Degree"

    processed_candidates = []

    for file in files:
        filename = file.filename or "resume"
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
        
        if ext not in ["pdf", "docx"]:
            # Skip unsupported files gracefully with notification
            continue
            
        file_bytes = await file.read()
        
        # 1. Extract text
        try:
            if ext == "pdf":
                raw_text = extract_text_from_pdf(file_bytes)
            elif ext == "docx":
                raw_text = extract_text_from_docx(file_bytes)
            else:
                continue
        except Exception as err:
            raw_text = f"[Text Extraction Error: {str(err)}]"
            
        # 2. Extract Candidate Entities
        entities = extract_candidate_entities(raw_text, fallback_filename=filename)
        
        # 3. Evaluate Match
        match_result = evaluate_resume_match(
            resume_text=raw_text,
            job_title=job_title,
            job_description=job_desc,
            explicit_required_skills=req_skills,
            experience_level=exp_level,
            is_fresher_friendly=is_fresher_friendly,
            min_education=min_edu,
        )
        
        # 4. Save to Database
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO candidates (
                    job_id, filename, file_type, candidate_name, candidate_email,
                    candidate_phone, candidate_links, extracted_text, match_score,
                    score_breakdown, matching_skills, missing_evidence, confirmed_gaps,
                    evidence_snippets, fresher_highlights, explanation, is_shortlisted
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                """,
                (
                    job_id,
                    filename,
                    ext.upper(),
                    entities["candidate_name"],
                    entities["candidate_email"],
                    entities["candidate_phone"],
                    json.dumps(entities["candidate_links"]),
                    raw_text,
                    match_result["match_score"],
                    json.dumps(match_result["score_breakdown"]),
                    json.dumps(match_result["matching_skills"]),
                    json.dumps(match_result["missing_evidence"]),
                    json.dumps(match_result["confirmed_gaps"]),
                    json.dumps(match_result["evidence_snippets"]),
                    json.dumps(match_result["fresher_highlights"]),
                    match_result["explanation"],
                ),
            )
            candidate_id = cursor.lastrowid
            conn.commit()

            cursor.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,))
            new_row = cursor.fetchone()
            processed_candidates.append(parse_candidate_row(new_row))

    # Return ranked descending by match_score
    processed_candidates.sort(key=lambda c: c.match_score, reverse=True)
    return processed_candidates

@router.get("/jobs/{job_id}/candidates", response_model=List[CandidateResponse])
def get_job_candidates(job_id: int):
    """Retrieves all evaluated candidates for a specific job, sorted by match score descending."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM candidates WHERE job_id = ? ORDER BY match_score DESC, created_at DESC",
            (job_id,),
        )
        rows = cursor.fetchall()
        return [parse_candidate_row(r) for r in rows]

@router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate_analysis(candidate_id: int):
    """Retrieves the full detailed analysis for an individual candidate."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Candidate record not found")
        return parse_candidate_row(row)

@router.patch("/candidates/{candidate_id}/shortlist", response_model=CandidateResponse)
def toggle_candidate_shortlist(candidate_id: int, payload: ShortlistUpdateRequest):
    """Updates candidate shortlisting status."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE candidates SET is_shortlisted = ? WHERE id = ?",
            (1 if payload.is_shortlisted else 0, candidate_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Candidate not found")
        conn.commit()

        cursor.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,))
        row = cursor.fetchone()
        return parse_candidate_row(row)

@router.get("/jobs/{job_id}/export-csv")
def export_candidates_to_csv(job_id: int):
    """Exports all candidate evaluation results for a job requisition to CSV format."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT title FROM jobs WHERE id = ?", (job_id,))
        job_row = cursor.fetchone()
        if not job_row:
            raise HTTPException(status_code=404, detail="Job requisition not found")
        job_title = job_row["title"]

        cursor.execute(
            "SELECT * FROM candidates WHERE job_id = ? ORDER BY match_score DESC",
            (job_id,),
        )
        rows = cursor.fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write CSV Header
    writer.writerow([
        "Rank",
        "Candidate Name",
        "Email",
        "Phone",
        "Overall Match Score (%)",
        "Technical Score (%)",
        "Experience / Project Score (%)",
        "Education Score (%)",
        "Matching Skills",
        "Missing Skills / Evidence",
        "Shortlisted Status",
        "Evaluation Explanation",
        "Resume Filename",
    ])

    for rank, r in enumerate(rows, start=1):
        score_breakdown_raw = json.loads(r["score_breakdown"] or "{}")
        matching_skills = ", ".join(json.loads(r["matching_skills"] or "[]"))
        missing_evidence = ", ".join(json.loads(r["missing_evidence"] or "[]"))
        shortlisted_str = "YES - SHORTLISTED" if r["is_shortlisted"] else "Under Review"

        writer.writerow([
            rank,
            r["candidate_name"] or "Unknown",
            r["candidate_email"] or "N/A",
            r["candidate_phone"] or "N/A",
            r["match_score"] or 0.0,
            score_breakdown_raw.get("technical_score", 0.0),
            score_breakdown_raw.get("experience_project_score", 0.0),
            score_breakdown_raw.get("education_score", 0.0),
            matching_skills,
            missing_evidence,
            shortlisted_str,
            r["explanation"] or "",
            r["filename"],
        ])

    output.seek(0)
    safe_title = "".join(c for c in job_title if c.isalnum() or c in ("-", "_")).rstrip()
    filename = f"candidates_{safe_title}_job_{job_id}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
