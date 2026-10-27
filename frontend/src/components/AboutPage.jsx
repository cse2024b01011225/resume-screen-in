import React from 'react';

export default function AboutPage({ onNavigateToScreening }) {
  return (
    <div className="main-content">
      {/* Hero Card */}
      <section className="dashboard-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span className="badge-tag">About Project</span>
              <span className="badge-tag badge-green">HCL Capstone Project</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
              Resume Screen-In
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.2rem' }}>
              AI-Powered Resume Screening &bull; Job Matching
            </p>
            <p style={{ fontSize: '0.95rem', color: '#60a5fa', fontWeight: 600, marginTop: '0.4rem' }}>
              Developed by: Yash Tomar | HCL Capstone Project
            </p>
          </div>

          <button className="btn-primary" onClick={onNavigateToScreening}>
            Open Resume Screening &rarr;
          </button>
        </div>

        <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0', opacity: 0.6 }} />

        {/* Purpose Statement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
            System Purpose & Objectives
          </h3>
          <p style={{ fontSize: '0.92rem', lineHeight: '1.7', color: 'var(--text-primary)' }}>
            The primary purpose of this platform is to provide recruiters with an intelligent, ethical, and explainable
            decision-support tool for shortlisting candidates against specific job openings. Key capabilities include
            <strong> AI-assisted resume screening</strong>, <strong>evidence-based candidate matching</strong>,
            <strong> transparent score breakdowns</strong>, and comprehensive <strong>skill-gap analysis</strong>.
          </p>
        </div>
      </section>

      {/* Highlights Grid */}
      <div className="dashboard-grid">
        <section className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <span>&#128065;</span> Evidence-Based Candidate Matching
            </h3>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Unlike black-box screening tools, every fit score is directly justified with verbatim sentence quotes
            mined from the candidate's resume text. Recruiters see exactly which sections and bullet points
            demonstrate the required technical competencies.
          </p>
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <span>&#127891;</span> Fresher-Friendly Evaluation
            </h3>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Recognizes academic capstone projects, internships, verified GitHub code repositories, and industry
            certifications (Coursera, Udemy, NPTEL, AWS) in lieu of corporate tenure, providing equitable
            evaluation for early-career applicants.
          </p>
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <span>&#9878;</span> Skill-Gap Diagnostic Reporting
            </h3>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Distinguishes between <em>Verified Matching Skills</em>, <em>Missing Evidence</em> (skills required by
            the role but not found in the resume, to be probed during technical interviews), and <em>Confirmed Gaps</em>.
          </p>
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <span>&#128737;</span> Privacy & Ethical AI Safeguards
            </h3>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Demographic and protected attributes (gender, age, marital status, nationality, religion) are completely
            excluded from evaluation. The platform serves strictly as recruiter decision support without automated
            hiring rejection.
          </p>
        </section>
      </div>

      {/* Technical Architecture */}
      <section className="dashboard-card" style={{ padding: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <span>&#9881;</span> Technical Specifications
          </h3>
          <span className="badge-tag">Zero Paid APIs</span>
        </div>

        <div className="diag-grid">
          <div className="diag-item">
            <div className="diag-label">Frontend Framework</div>
            <div className="diag-value">React 19 + Vite 6</div>
          </div>

          <div className="diag-item">
            <div className="diag-label">Backend Engine</div>
            <div className="diag-value">Python 3.14 + FastAPI</div>
          </div>

          <div className="diag-item">
            <div className="diag-label">Persistence Layer</div>
            <div className="diag-value">SQLite (Local Database)</div>
          </div>

          <div className="diag-item">
            <div className="diag-label">Document Parsers</div>
            <div className="diag-value">PyPDF + python-docx</div>
          </div>
        </div>
      </section>
    </div>
  );
}
