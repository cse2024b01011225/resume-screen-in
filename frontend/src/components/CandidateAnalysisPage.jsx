import React, { useState } from 'react';
import { toggleCandidateShortlist } from '../services/api';

export default function CandidateAnalysisPage({
  candidate,
  onBackToScreening,
  onCandidateUpdated,
}) {
  const [showRawText, setShowRawText] = useState(false);
  const [isUpdatingShortlist, setIsUpdatingShortlist] = useState(false);

  if (!candidate) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div className="empty-icon">&#128269;</div>
          <h3>No Candidate Selected</h3>
          <p>Please select a candidate from the Resume Screening page to view in-depth evaluation.</p>
          <button className="btn-primary" style={{ margin: '1rem auto' }} onClick={onBackToScreening}>
            &larr; Back to Resume Screening
          </button>
        </div>
      </div>
    );
  }

  const handleToggleShortlist = async () => {
    setIsUpdatingShortlist(true);
    try {
      const updated = await toggleCandidateShortlist(candidate.id, !candidate.is_shortlisted);
      onCandidateUpdated(updated);
    } catch (err) {
      alert(`Failed to update shortlist status: ${err.message}`);
    } finally {
      setIsUpdatingShortlist(false);
    }
  };

  const { score_breakdown } = candidate;

  return (
    <div className="main-content">
      {/* Top Navigation & Profile Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '-0.5rem' }}>
        <button className="btn-icon-subtle" onClick={onBackToScreening}>
          &larr; Back to Candidate List
        </button>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Candidate ID #{candidate.id} &bull; Processed on {candidate.created_at}
        </span>
      </div>

      <section className="analysis-header-card">
        <div className="candidate-title-meta">
          <h2>
            <span>&#128100;</span> {candidate.candidate_name}
            {candidate.is_shortlisted && (
              <span className="badge-tag badge-green">&#10004; SHORTLISTED</span>
            )}
            <span className="badge-tag">{candidate.file_type} Resume</span>
          </h2>

          <div className="candidate-contact-links">
            {candidate.candidate_email && (
              <span>&#9993; {candidate.candidate_email}</span>
            )}
            {candidate.candidate_phone && (
              <span>&#9742; {candidate.candidate_phone}</span>
            )}
            <span>&#128196; {candidate.filename}</span>

            {candidate.candidate_links && candidate.candidate_links.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {candidate.candidate_links.map((link, i) => (
                  <a
                    key={i}
                    href={link.startsWith('http') ? link : `https://${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    &#128279; {link.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="overall-score-pill">
            <span className="score-number">{candidate.match_score}%</span>
            <span className="score-label">Job Fit Match</span>
          </div>

          <button
            className={`btn-primary ${candidate.is_shortlisted ? 'badge-green' : ''}`}
            style={{
              padding: '0.65rem 1.25rem',
              backgroundColor: candidate.is_shortlisted ? 'var(--success)' : 'var(--primary)',
            }}
            disabled={isUpdatingShortlist}
            onClick={handleToggleShortlist}
          >
            {candidate.is_shortlisted ? '&#10004; Shortlisted' : '+ Shortlist Candidate'}
          </button>
        </div>
      </section>

      {/* Two-Column Deep-Dive Grid */}
      <div className="analysis-grid">
        {/* Left Column: Transparent Score Breakdown & Explanation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Transparent Score Breakdown Card */}
          <section className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">
                <span>&#128202;</span> Objective Match-Score Breakdown
              </h3>
              <span className="badge-tag">Evidence-Based</span>
            </div>

            <div className="score-breakdown-card">
              {/* Technical Score */}
              <div className="breakdown-row">
                <div className="breakdown-row-header">
                  <span>Technical Core Competencies (50% Weight)</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {score_breakdown?.technical_score}%
                  </span>
                </div>
                <div className="score-bar-bg" style={{ width: '100%', height: '10px' }}>
                  <div
                    className="score-bar-fill"
                    style={{ width: `${Math.min(score_breakdown?.technical_score || 0, 100)}%` }}
                  />
                </div>
              </div>

              {/* Projects & Experience Score */}
              <div className="breakdown-row">
                <div className="breakdown-row-header">
                  <span>Practical Projects, Internships & Repositories (35% Weight)</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {score_breakdown?.experience_project_score}%
                  </span>
                </div>
                <div className="score-bar-bg" style={{ width: '100%', height: '10px' }}>
                  <div
                    className="score-bar-fill"
                    style={{ width: `${Math.min(score_breakdown?.experience_project_score || 0, 100)}%` }}
                  />
                </div>
              </div>

              {/* Education & Foundations Score */}
              <div className="breakdown-row">
                <div className="breakdown-row-header">
                  <span>Educational Foundation & Relevant Degrees (15% Weight)</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {score_breakdown?.education_score}%
                  </span>
                </div>
                <div className="score-bar-bg" style={{ width: '100%', height: '10px' }}>
                  <div
                    className="score-bar-fill"
                    style={{ width: `${Math.min(score_breakdown?.education_score || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recruiter Narrative Explanation */}
            <div style={{ marginTop: '0.5rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.84rem', color: '#60a5fa', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Recruiter Evaluation Explanation
              </h4>
              <p style={{ fontSize: '0.86rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                {candidate.explanation}
              </p>
            </div>
          </section>

          {/* Differentiating Feature: Fresher-Friendly Evaluation */}
          <section className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">
                <span>&#127891;</span> Fresher-Friendly Practical Assets
              </h3>
              <span className="badge-tag badge-green">Project Recognition</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Evaluates academic capstone projects, internships, GitHub code portfolios, and industry
              certifications in lieu of multi-year corporate tenure:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {candidate.fresher_highlights && candidate.fresher_highlights.length > 0 ? (
                candidate.fresher_highlights.map((h, i) => (
                  <div key={i} className="highlight-item">
                    <span style={{ color: '#34d399', fontSize: '1rem' }}>&#10004;</span>
                    <span>{h}</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  No explicit academic project or certification keywords detected.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Evidence Snippets & Skill Gap Report */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Skill-Gap Diagnostic Report */}
          <section className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">
                <span>&#9878;</span> Skill-Gap Diagnostic Report
              </h3>
              <span className="badge-tag">Requirements Analysis</span>
            </div>

            {/* Matching Verified Skills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34d399' }}>
                Verified Matching Skills ({candidate.matching_skills?.length || 0}):
              </div>
              <div className="skill-tag-group">
                {candidate.matching_skills && candidate.matching_skills.length > 0 ? (
                  candidate.matching_skills.map((s, i) => (
                    <span key={i} className="skill-pill" style={{ color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                      &#10004; {s}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>None detected</span>
                )}
              </div>
            </div>

            {/* Missing Evidence */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fbbf24' }}>
                Missing Evidence in Resume ({candidate.missing_evidence?.length || 0}):
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                These skills were required by the job specification but have no documented mention. Probe these competencies during technical interview:
              </p>
              <div className="skill-tag-group">
                {candidate.missing_evidence && candidate.missing_evidence.length > 0 ? (
                  candidate.missing_evidence.map((s, i) => (
                    <span key={i} className="skill-pill missing">
                      ? {s}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    All target skills accounted for!
                  </span>
                )}
              </div>
            </div>

            {/* Confirmed Gaps */}
            {candidate.confirmed_gaps && candidate.confirmed_gaps.length > 0 && (
              <div className="gap-alert-card" style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>
                  Confirmed Discrepancies & Gaps:
                </div>
                {candidate.confirmed_gaps.map((gap, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#fca5a5' }}>
                    &bull; {gap}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Differentiating Feature: Evidence-Based Citations */}
          <section className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">
                <span>&#128269;</span> Verified Resume Evidence Snippets
              </h3>
              <span className="badge-tag">Verbatim Excerpts</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Direct excerpts and quotes extracted from the candidate's resume that justify the awarded scores:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '340px', overflowY: 'auto' }}>
              {candidate.evidence_snippets && candidate.evidence_snippets.length > 0 ? (
                candidate.evidence_snippets.map((item, idx) => (
                  <div key={idx} className="quote-card">
                    <div className="quote-header">
                      <span>Evidence for: {item.skill}</span>
                      <span>[{item.section}]</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>
                      "{item.snippet}"
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  No direct sentence quotes recorded.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Ethical AI & Privacy Disclosure */}
      <section className="ethical-banner">
        <span style={{ fontSize: '1.25rem' }}>&#128737;</span>
        <div>
          <strong>Ethical AI & Data Privacy Safeguards:</strong> Scoring is strictly computed based on
          job-relevant technical competencies, project evidence, and verified educational credentials.
          Protected personal attributes (gender, age, marital status, nationality, or demographic traits)
          are completely excluded from evaluation. Results are provided to assist recruiter decision-making
          and do not constitute automated hiring decisions.
        </div>
      </section>

      {/* Raw Extracted Text Drawer */}
      <section className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
            <span>&#128196;</span> Extracted Resume Text Inspector
          </h3>
          <button
            className="btn-icon-subtle"
            onClick={() => setShowRawText(!showRawText)}
          >
            {showRawText ? 'Hide Text' : 'View Full Extracted Text'}
          </button>
        </div>

        {showRawText && (
          <pre
            style={{
              background: 'var(--bg-primary)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
            }}
          >
            {candidate.extracted_text_preview || 'No raw text available.'}
          </pre>
        )}
      </section>
    </div>
  );
}
