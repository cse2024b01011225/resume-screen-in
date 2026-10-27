import sys
from pathlib import Path
import io

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    with TestClient(app) as client:
        print("1. Testing GET /api/health...")
        res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("   -> OK:", res.json())

    print("\n2. Testing POST /api/jobs (Create Job)...")
    import time
    unique_suffix = int(time.time() * 1000)
    job_payload = {
        "title": f"Junior Python / React Developer #{unique_suffix}",
        "description": "Looking for a developer skilled in Python, FastAPI, React, SQLite, and Git for building modern web applications. Academic projects and internships welcome.",
        "required_skills": ["Python", "FastAPI", "React", "SQLite", "Git"],
        "experience_level": "Entry / Fresher",
        "is_fresher_friendly": True,
        "min_education": "Bachelor's Degree",
    }
    res = client.post("/api/jobs", json=job_payload)
    assert res.status_code == 201, f"Job creation failed: {res.text}"
    job_data = res.json()
    job_id = job_data["id"]
    print(f"   -> OK: Created Job ID {job_id}: {job_data['title']}")

    print("\n3. Testing GET /api/jobs...")
    res = client.get("/api/jobs")
    assert res.status_code == 200
    jobs = res.json()
    assert len(jobs) >= 1
    print(f"   -> OK: Found {len(jobs)} jobs in database.")

    print("\n4. Testing POST /api/jobs/{id}/resumes (Upload & Screen PDF Resume)...")
    # Let's test with docx and pypdf directly
    import docx
    doc = docx.Document()
    doc.add_heading("Yash Tomar", level=0)
    doc.add_paragraph("Email: yash.tomar@example.com | Phone: +91 9876543210 | github.com/yash-dev")
    doc.add_heading("Education", level=1)
    doc.add_paragraph("B.Tech in Computer Science and Engineering, 2024. CGPA: 8.5/10")
    doc.add_heading("Technical Skills", level=1)
    doc.add_paragraph("Languages & Frameworks: Python, FastAPI, React, JavaScript, SQLite, SQL, HTML/CSS, Git.")
    doc.add_heading("Academic Projects", level=1)
    doc.add_paragraph("Resume Screen-In: Built end-to-end full-stack portal using React, Vite, and FastAPI with SQLite.")
    doc.add_heading("Internships & Certifications", level=1)
    doc.add_paragraph("Full Stack Web Development Intern at TechCorp. Certified Python Developer via Coursera.")
    
    docx_io = io.BytesIO()
    doc.save(docx_io)
    docx_bytes = docx_io.getvalue()

    files = [
        ("files", ("yash_resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
    ]
    res = client.post(f"/api/jobs/{job_id}/resumes", files=files)
    assert res.status_code == 200, f"Resume screening failed: {res.text}"
    candidates = res.json()
    assert len(candidates) == 1
    candidate = candidates[0]
    candidate_id = candidate["id"]
    print(f"   -> OK: Screened Candidate {candidate['candidate_name']} ({candidate['candidate_email']})")
    print(f"   -> Overall Match Score: {candidate['match_score']}%")
    print(f"   -> Matching Skills: {candidate['matching_skills']}")
    print(f"   -> Missing Evidence: {candidate['missing_evidence']}")
    print(f"   -> Fresher Highlights: {candidate['fresher_highlights']}")
    print(f"   -> Evidence Snippets Count: {len(candidate['evidence_snippets'])}")

    print("\n5. Testing GET /api/candidates/{id} (Candidate Analysis Details)...")
    res = client.get(f"/api/candidates/{candidate_id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["candidate_name"] == "Yash Tomar"
    print("   -> OK: Retrieved candidate analysis.")

    print("\n6. Testing PATCH /api/candidates/{id}/shortlist (Shortlist Candidate)...")
    res = client.patch(f"/api/candidates/{candidate_id}/shortlist", json={"is_shortlisted": True})
    assert res.status_code == 200
    assert res.json()["is_shortlisted"] is True
    print("   -> OK: Candidate successfully shortlisted!")

    print("\n7. Testing GET /api/jobs/{id}/export-csv (CSV Export)...")
    res = client.get(f"/api/jobs/{job_id}/export-csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    csv_text = res.text
    assert "Yash Tomar" in csv_text
    assert "YES - SHORTLISTED" in csv_text
    print("   -> OK: CSV export generated successfully.")

    print("\n8. Testing GET /api/stats...")
    res = client.get("/api/stats")
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_jobs"] >= 1
    assert stats["total_resumes"] >= 1
    assert stats["total_shortlisted"] >= 1
    print(f"   -> OK: Stats: {stats['total_jobs']} jobs, {stats['total_resumes']} resumes, {stats['total_shortlisted']} shortlisted.")

    print("\n9. Testing Duplicate Job Prevention...")
    # Attempt to create the exact duplicate of job_payload
    dup_res = client.post("/api/jobs", json=job_payload)
    assert dup_res.status_code == 409, f"Expected 409 Conflict, got {dup_res.status_code}: {dup_res.text}"
    print("   -> OK: Identical duplicate job prevented with 409 Conflict.")

    # Legitimate job with same title but different requirements should succeed
    diff_job_payload = {
        **job_payload,
        "description": "Different requirements for senior scope with microservices.",
        "experience_level": "Senior (5+ Years)",
    }
    legit_res = client.post("/api/jobs", json=diff_job_payload)
    assert legit_res.status_code == 201
    temp_legit_id = legit_res.json()["id"]
    print(f"   -> OK: Legitimate job with different requirements allowed (ID #{temp_legit_id}).")

    print("\n10. Testing Safe Job Deletion...")
    # 10a. Deleting a job with 0 candidates should succeed
    del_empty_res = client.delete(f"/api/jobs/{temp_legit_id}")
    assert del_empty_res.status_code == 200
    print(f"   -> OK: Empty job #{temp_legit_id} deleted successfully.")

    # 10b. Deleting a job WITH candidates without force should be blocked
    del_blocked_res = client.delete(f"/api/jobs/{job_id}")
    assert del_blocked_res.status_code == 400
    print(f"   -> OK: Deletion of job #{job_id} with screening history safely blocked without force.")

    # 10c. Deleting with force=true should succeed and cleanly remove only that job's candidates
    del_forced_res = client.delete(f"/api/jobs/{job_id}?force=true")
    assert del_forced_res.status_code == 200
    print(f"   -> OK: Job #{job_id} force deleted successfully.")

    print("\n=======================================================")
    print("[SUCCESS] All 10 Backend & Deletion Tests Passed!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
