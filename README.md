# Resume Screen-In

### AI-Powered Resume Screening & Job Matching

**Author / Developer**: Yash Tomar  
**Project Category**: HCL Capstone Project  
**Status**: Functional Production MVP  

---

## 📌 Project Overview & Purpose

**Resume Screen-In** is an intelligent recruiter decision-support platform designed to streamline candidate evaluation and shortlisting. 

### Core Purpose
- **AI-Assisted Resume Screening**: Ingest and process multiple resumes simultaneously in `.pdf` and `.docx` formats using local parsers.
- **Evidence-Based Candidate Matching**: Calculate transparent, verifiable fit scores accompanied by verbatim quotes from the candidate's resume.
- **Explainable Scoring**: Break down scores into Technical Competencies (50%), Practical Projects & Internships (35%), and Educational Foundation (15%).
- **Skill-Gap Analysis**: Distinguish verified competencies from missing resume evidence (for interview follow-up) and confirmed qualification deficits.
- **Equitable Fresher Evaluation**: Reward academic capstone projects, internships, GitHub repositories, and certifications in lieu of corporate tenure.
- **Zero Mandatory Paid APIs**: All parsing, entity extraction, and matching routines execute 100% locally and offline.

---

## 🌟 Key Differentiating Features

1. **Evidence-Based Candidate Ranking**:
   - Every candidate match score is backed by exact sentence quotes and section citations extracted directly from the resume.
2. **Fresher-Friendly Evaluation Mode**:
   - Actively identifies academic projects, internships, hackathons, and certifications (Coursera, Udemy, NPTEL, AWS, HackerRank) and active GitHub code links.
3. **Skill-Gap Diagnostic Report**:
   - Separates *Verified Skills* (green), *Missing Evidence* (amber, recommended for technical interview probing), and *Confirmed Gaps* (red, such as qualification or experience level shortfall).
4. **Data Privacy & Ethical AI Guardrails**:
   - Excludes protected demographic characteristics (gender, age, marital status, race, nationality) from evaluation. Serves as decision support without automated rejections.
5. **Batch Processing & Export**:
   - Supports bulk multi-resume uploads and generates downloadable `.csv` candidate ranking reports with complete score breakdowns.

---

## 🧭 Navigable Application Pages

1. **Recruiter Dashboard** (`/`):
   - Key KPI metric cards (Active Requisitions, Resumes Screened, Shortlisted Candidates, Average Fit Score).
   - Quick Job Requisition creator and list of active job openings.
   - Real-time Backend Health and Runtime Diagnostics inspector.
2. **Resume Screening** (`/screening`):
   - Job requisition selector.
   - Batch drag-and-drop resume upload for `.pdf` and `.docx` files.
   - Candidate ranking table with rank badges, score progress bars, and breakdown mini-meters.
   - One-click candidate shortlisting and **CSV Export**.
3. **Candidate Analysis** (`/analysis`):
   - Candidate profile, contact info, and portfolio links.
   - Detailed score breakdown (Technical vs Projects/Internships vs Education).
   - Recruiter narrative evaluation summary.
   - Fresher-friendly practical assets breakdown.
   - Skill-Gap report and verified resume evidence quotes.
   - Collapsible raw extracted resume text inspector.
4. **About Project** (`/about`):
   - Project specifications, author attribution (Developed by Yash Tomar), and architectural overview.

---

## 🛠️ Technology Stack & Verified Environment

- **Frontend**: React 19 + Vite 6
- **Backend**: Python 3.14.3 + FastAPI + Uvicorn + Pydantic v2
- **Database**: SQLite (Local persistent storage, thread-safe)
- **Document Parsers**: `pypdf` (PDF extraction) + `python-docx` (Word extraction)
- **Verified Host**: Windows 11 x64, Python 3.14.3, Node.js v24.14.0, npm 11.9.0

---

## 📁 Project Architecture

```
resume-career-intelligence/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic schemas (Job, Candidate, Breakdown, Stats)
│   │   ├── routers/
│   │   │   ├── health.py        # /api/health
│   │   │   ├── jobs.py          # /api/jobs, /api/stats
│   │   │   └── candidates.py    # /api/jobs/{id}/resumes, /api/candidates/{id}, export CSV
│   │   ├── services/
│   │   │   ├── parser.py        # PDF & DOCX text extraction & entity extraction
│   │   │   └── matcher.py       # Evidence-based, fresher-friendly matching engine
│   │   ├── config.py            # App settings, developer attribution & paths
│   │   ├── database.py          # SQLite schema, tables & auto-migrations
│   │   └── main.py              # FastAPI app with CORS middleware
│   ├── data/
│   │   └── resume_screening.db  # SQLite database
│   ├── venv/                    # Python virtual environment
│   ├── requirements.txt         # Compatible Python dependencies
│   ├── test_backend.py          # Health check smoke test
│   ├── test_full_workflow.py    # Complete 10-stage automated backend test
│   └── audit_submission_readiness.py # Final submission readiness audit suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                # Persistent header, nav tabs & health pill
│   │   │   ├── DashboardPage.jsx         # Page 1: Recruiter dashboard & metrics
│   │   │   ├── ScreeningPage.jsx         # Page 2: Batch upload & candidate rankings
│   │   │   ├── CandidateAnalysisPage.jsx # Page 3: Evidence & skill-gap deep dive
│   │   │   └── AboutPage.jsx             # Page 4: Project overview & author details
│   │   ├── services/
│   │   │   └── api.js                    # Resilient API client with auto-discovery
│   │   ├── App.jsx                       # Top-level state & page view router
│   │   ├── App.css                       # Recruiter UI styling
│   │   ├── index.css                     # Global typography & design tokens
│   │   └── main.jsx                      # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js                   # Vite dev server + /api proxy
├── .gitignore
└── README.md
```

---

## 🚀 Exact Windows Setup & Run Instructions

Open **two separate PowerShell terminals** in the project root folder:

### Terminal 1: Backend (FastAPI)
```powershell
# 1. Navigate to backend directory
cd backend

# 2. Activate Python virtual environment
.\venv\Scripts\Activate.ps1

# 3. (Optional) Run automated tests & submission readiness audit
python test_full_workflow.py
python audit_submission_readiness.py

# 4. Start the FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API Docs (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Terminal 2: Frontend (React + Vite)
```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Start the Vite React development server
npm run dev
```

- Recruiter Portal: Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Verification & Acceptance Checklist

1. **Author Attribution**:
   - The footer across all views displays: `Developed by Yash Tomar | HCL Capstone Project`.
   - The **About** tab provides complete project specifications and developer attribution.
2. **Backend Connectivity**:
   - Top status pill displays **"Backend Online (<latency>ms)"** in green.
   - The Diagnostics card confirms `FastAPI: ONLINE (200 OK)` and `SQLite Database: Connected`.
3. **Recruiter Workflow**:
   - Select or create a job specification in the Dashboard or Screening page.
   - Batch upload `.pdf` or `.docx` resumes.
   - View real-time calculated match scores, skill pills, and shortlist candidates.
   - Download the full candidate report via **"Export to CSV"**.
   - Click **"Analysis →"** on any candidate to inspect verified evidence snippets and the skill-gap diagnostic report.
