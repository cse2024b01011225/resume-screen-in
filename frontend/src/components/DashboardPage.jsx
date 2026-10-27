import React, { useState } from 'react';
import { createJob, deleteJob } from '../services/api';

export default function DashboardPage({
  stats,
  jobs,
  health,
  onRefreshStats,
  onDeleteJob,
  onNavigateToScreening,
  onSelectCandidate,
}) {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [requiredSkillsStr, setRequiredSkillsStr] = useState('Python, FastAPI, React, SQLite, Git');
  const [experienceLevel, setExperienceLevel] = useState('Entry / Fresher');
  const [isFresherFriendly, setIsFresherFriendly] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteJob = async (job, e) => {
    e.stopPropagation();
    const candidateCount = job.candidate_count || 0;

    // Requirement 2: Show confirmation dialog displaying the job title before deletion
    let confirmPrompt = `Are you sure you want to delete the job requisition:\n"${job.title}" (ID #${job.id})?`;
    if (candidateCount > 0) {
      confirmPrompt += `\n\n⚠️ Note: This requisition has ${candidateCount} evaluated candidate(s). Deleting it will also safely delete its associated candidate records.`;
    }

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    setDeletingId(job.id);
    try {
      if (onDeleteJob) {
        await onDeleteJob(job.id, candidateCount > 0);
      } else {
        await deleteJob(job.id, candidateCount > 0);
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      alert(`Could not delete job: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateJob = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const skills = requiredSkillsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await createJob({
        title: jobTitle,
        description: jobDescription,
        required_skills: skills,
        experience_level: experienceLevel,
        is_fresher_friendly: isFresherFriendly,
        min_education: "Bachelor's Degree",
      });

      setSaveSuccess(true);
      setJobTitle('');
      setJobDescription('');
      onRefreshStats();
      // Navigate to screening with new job after 1s
      setTimeout(() => {
        onNavigateToScreening(created.id);
      }, 800);
    } catch (err) {
      alert(`Failed to save job requisition: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="main-content">
      {/* KPI Overview Metrics */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">&#128188;</div>
          <div className="stat-content">
            <h4>Active Requisitions</h4>
            <div className="stat-value">{stats ? stats.total_jobs : '--'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">&#128196;</div>
          <div className="stat-content">
            <h4>Resumes Screened</h4>
            <div className="stat-value">{stats ? stats.total_resumes : '--'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.15)' }}>
            &#127942;
          </div>
          <div className="stat-content">
            <h4>Shortlisted Candidates</h4>
            <div className="stat-value">{stats ? stats.total_shortlisted : '--'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)' }}>
            &#9889;
          </div>
          <div className="stat-content">
            <h4>Avg. Fit Score</h4>
            <div className="stat-value">{stats ? `${stats.avg_match_score}%` : '--'}</div>
          </div>
        </div>
      </section>

      {/* Workflow Pipeline Stepper */}
      <section className="workflow-stepper">
        <div className="step-card active" onClick={() => onNavigateToScreening()}>
          <div className="step-number">1</div>
          <div className="step-info">
            <h3>Job Specification</h3>
            <p>Define requirements & skills</p>
          </div>
        </div>
        <div className="step-card" onClick={() => onNavigateToScreening()}>
          <div className="step-number">2</div>
          <div className="step-info">
            <h3>Resume Ingestion</h3>
            <p>PDF & DOCX parsing engine</p>
          </div>
        </div>
        <div className="step-card" onClick={() => onNavigateToScreening()}>
          <div className="step-number">3</div>
          <div className="step-info">
            <h3>AI Matching</h3>
            <p>Explainable candidate scoring</p>
          </div>
        </div>
        <div className="step-card" onClick={() => onNavigateToScreening()}>
          <div className="step-number">4</div>
          <div className="step-info">
            <h3>Shortlist & Export</h3>
            <p>Rankings, gaps & CSV download</p>
          </div>
        </div>
      </section>

      {/* Action Panels */}
      <div className="dashboard-grid">
        {/* Job Description Requisition Card */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <span>&#128188;</span> Quick Job Requisition
            </h2>
            <span className="badge-tag">Define Opening</span>
          </div>

          <div className="form-group">
            <label htmlFor="dash-job-title">Job Title / Target Role *</label>
            <input
              id="dash-job-title"
              type="text"
              className="input-text"
              placeholder="e.g. Full-Stack Python & React Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dash-job-desc">Job Description & Core Responsibilities *</label>
            <textarea
              id="dash-job-desc"
              className="input-textarea"
              placeholder="Paste requirements, expected competencies, tools, and project goals..."
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dash-skills">Required Technical Skills (Comma-separated)</label>
            <input
              id="dash-skills"
              type="text"
              className="input-text"
              value={requiredSkillsStr}
              onChange={(e) => setRequiredSkillsStr(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="dash-exp">Experience Level</label>
              <select
                id="dash-exp"
                className="input-select"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                <option value="Entry / Fresher">Entry / Fresher</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="Senior (5+ Years)">Senior (5+ Years)</option>
              </select>
            </div>

            <label className="checkbox-group" style={{ marginTop: '1.25rem' }}>
              <input
                type="checkbox"
                checked={isFresherFriendly}
                onChange={(e) => setIsFresherFriendly(e.target.checked)}
              />
              <span className="checkbox-label">Fresher-Friendly Evaluation</span>
            </label>
          </div>

          {saveSuccess && (
            <div style={{ color: '#34d399', fontSize: '0.85rem' }}>
              &#10004; Job saved! Opening Resume Screening...
            </div>
          )}

          <button
            className="btn-primary"
            disabled={isSaving || !jobTitle.trim() || !jobDescription.trim()}
            onClick={handleCreateJob}
          >
            {isSaving ? 'Saving...' : 'Create & Proceed to Screening \u2192'}
          </button>
        </section>

        {/* Existing Job Requisitions List */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <span>&#128193;</span> Active Requisitions
            </h2>
            <span className="badge-tag">{jobs.length} Total</span>
          </div>

          {jobs.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-icon">&#128221;</div>
              <h4>No Active Job Openings</h4>
              <p style={{ fontSize: '0.84rem' }}>
                Create your first job specification on the left to start screening resumes.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{job.title}</h4>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {job.experience_level} &bull; {job.candidate_count} candidates screened ({job.shortlisted_count} shortlisted)
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => onNavigateToScreening(job.id)}
                    >
                      Screen Resumes
                    </button>

                    <button
                      className="btn-icon-subtle"
                      style={{
                        padding: '0.4rem 0.65rem',
                        fontSize: '0.88rem',
                        color: '#f87171',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        cursor: deletingId === job.id ? 'wait' : 'pointer',
                      }}
                      title={`Delete "${job.title}"`}
                      disabled={deletingId === job.id}
                      onClick={(e) => handleDeleteJob(job, e)}
                    >
                      {deletingId === job.id ? '...' : '\uD83D\uDDD1\uFE0F'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Diagnostics Card */}
      <section className="diagnostics-card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
            <span>&#128295;</span> Backend Health & Runtime Diagnostics
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Status: {health.status.toUpperCase()} &bull; Latency: {health.latencyMs}ms
          </span>
        </div>

        <div className="diag-grid">
          <div className="diag-item">
            <div className="diag-label">FastAPI Backend</div>
            <div
              className="diag-value"
              style={{
                color: health.status === 'connected' ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {health.status === 'connected' ? 'ONLINE (200 OK)' : 'OFFLINE'}
            </div>
          </div>

          <div className="diag-item">
            <div className="diag-label">SQLite Database</div>
            <div className="diag-value">
              {health.data?.database || (health.status === 'connected' ? 'Connected' : 'Offline')}
            </div>
          </div>

          <div className="diag-item">
            <div className="diag-label">Python Version</div>
            <div className="diag-value">
              {health.data?.python_version ? `v${health.data.python_version}` : 'Python 3.14.3'}
            </div>
          </div>

          <div className="diag-item">
            <div className="diag-label">Active Connection Mode</div>
            <div className="diag-value">{health.baseUrl || 'Auto-Detected'}</div>
          </div>
        </div>

        {health.error && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '6px',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
            }}
          >
            <strong>Connection Error:</strong> {health.error}. Make sure the FastAPI backend is running via{' '}
            <code>uvicorn app.main:app --reload --host 127.0.0.1 --port 8000</code>.
          </div>
        )}
      </section>
    </div>
  );
}
