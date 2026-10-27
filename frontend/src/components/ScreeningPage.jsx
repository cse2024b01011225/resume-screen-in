import React, { useState, useEffect, useRef } from 'react';
import {
  getJobs,
  uploadResumes,
  getJobCandidates,
  toggleCandidateShortlist,
  getExportCsvUrl,
} from '../services/api';

export default function ScreeningPage({
  initialJobId,
  jobs,
  onRefreshJobs,
  onSelectCandidate,
}) {
  const [selectedJobId, setSelectedJobId] = useState(initialJobId || (jobs[0]?.id || ''));
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'shortlisted' | 'top'
  const fileInputRef = useRef(null);

  // Sync selectedJobId if initialJobId changes
  useEffect(() => {
    if (initialJobId) {
      setSelectedJobId(initialJobId);
    } else if (!selectedJobId && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [initialJobId, jobs]);

  // Fetch candidates when job selection changes
  useEffect(() => {
    if (!selectedJobId) {
      setCandidates([]);
      return;
    }

    let isMounted = true;
    setIsLoadingCandidates(true);
    getJobCandidates(selectedJobId)
      .then((data) => {
        if (isMounted) setCandidates(data);
      })
      .catch((err) => {
        console.error('Failed to load candidates:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCandidates(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedJobId]);

  const activeJob = jobs.find((j) => String(j.id) === String(selectedJobId));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => {
      const ext = f.name.toLowerCase().split('.').pop();
      return ext === 'pdf' || ext === 'docx';
    });
    setSelectedFiles(validFiles);
  };

  const handleUploadAndScreen = async () => {
    if (!selectedJobId) {
      alert('Please select or create a job requisition first.');
      return;
    }
    if (selectedFiles.length === 0) {
      alert('Please select at least one .pdf or .docx resume.');
      return;
    }

    setIsUploading(true);
    try {
      const screened = await uploadResumes(selectedJobId, selectedFiles);
      setCandidates((prev) => {
        // Merge without duplicates
        const existingIds = new Set(prev.map((c) => c.id));
        const newOnes = screened.filter((c) => !existingIds.has(c.id));
        const combined = [...newOnes, ...prev];
        return combined.sort((a, b) => b.match_score - a.match_score);
      });
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefreshJobs();
    } catch (err) {
      alert(`Resume parsing and screening failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleShortlist = async (candidate, e) => {
    e.stopPropagation();
    const nextStatus = !candidate.is_shortlisted;
    try {
      const updated = await toggleCandidateShortlist(candidate.id, nextStatus);
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidate.id ? { ...c, is_shortlisted: updated.is_shortlisted } : c))
      );
      onRefreshJobs();
    } catch (err) {
      alert(`Failed to update shortlist status: ${err.message}`);
    }
  };

  const handleExportCsv = () => {
    if (!selectedJobId) return;
    const url = getExportCsvUrl(selectedJobId);
    window.open(url, '_blank');
  };

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    if (filterMode === 'shortlisted') return c.is_shortlisted;
    if (filterMode === 'top') return c.match_score >= 70;
    return true;
  });

  return (
    <div className="main-content">
      {/* Top Controls: Requisition Selector */}
      <section className="dashboard-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
            <label htmlFor="job-selector" style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Target Job Requisition:
            </label>
            <select
              id="job-selector"
              className="input-select"
              style={{ flex: 1, maxWidth: '400px' }}
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              {jobs.length === 0 ? (
                <option value="">No Requisitions Available</option>
              ) : (
                jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.experience_level})
                  </option>
                ))
              )}
            </select>
          </div>

          {activeJob && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge-tag">Req #{activeJob.id}</span>
              <span className="badge-tag badge-green">{activeJob.experience_level}</span>
              {activeJob.is_fresher_friendly && (
                <span className="badge-tag badge-amber">&#10004; Fresher-Friendly</span>
              )}
            </div>
          )}
        </div>

        {activeJob && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <strong>Required Skills:</strong>{' '}
            {activeJob.required_skills?.length > 0 ? activeJob.required_skills.join(', ') : 'All Technical Skills'} &bull;{' '}
            <strong>Description:</strong> {activeJob.description.slice(0, 140)}...
          </div>
        )}
      </section>

      {/* Batch Upload Section */}
      <section className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">
            <span>&#128194;</span> Ingest Resumes (PDF & DOCX)
          </h2>
          <span className="badge-tag">Multi-File Parser</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          id="resume-file-input"
          multiple
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div
          className="upload-dropzone"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon-circle">&#128392;</div>
          <h3>Select or Drop Candidate Resumes</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Click to browse or drag and drop batches of <strong>.PDF</strong> or <strong>.DOCX</strong> resumes.
          </p>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Text will be extracted cleanly without sending files to any paid cloud APIs.
          </span>
        </div>

        {selectedFiles.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                {selectedFiles.length} File(s) Selected Ready for Screening:
              </span>
              <button
                className="btn-icon-subtle"
                onClick={() => {
                  setSelectedFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Clear
              </button>
            </div>

            <div className="file-queue">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="file-item">
                  <span>&#128196; {file.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: '1rem' }}
              disabled={isUploading}
              onClick={handleUploadAndScreen}
            >
              {isUploading ? 'Extracting & Screening Resumes...' : `Screen ${selectedFiles.length} Candidate(s) Now \u2192`}
            </button>
          </div>
        )}
      </section>

      {/* Screened Candidates Comparison Table */}
      <section className="results-section">
        <div className="table-toolbar">
          <div>
            <h2 className="card-title">
              <span>&#127942;</span> Candidate Ranking & Screening Results
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Showing {filteredCandidates.length} candidate(s) evaluated against "{activeJob?.title || 'Selected Job'}"
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Filter buttons */}
            <div className="nav-tabs" style={{ padding: '0.2rem' }}>
              <button
                className={`nav-tab-btn ${filterMode === 'all' ? 'active' : ''}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                onClick={() => setFilterMode('all')}
              >
                All ({candidates.length})
              </button>
              <button
                className={`nav-tab-btn ${filterMode === 'shortlisted' ? 'active' : ''}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                onClick={() => setFilterMode('shortlisted')}
              >
                Shortlisted ({candidates.filter((c) => c.is_shortlisted).length})
              </button>
              <button
                className={`nav-tab-btn ${filterMode === 'top' ? 'active' : ''}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                onClick={() => setFilterMode('top')}
              >
                Score &ge; 70%
              </button>
            </div>

            <button
              className="btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
              disabled={candidates.length === 0}
              onClick={handleExportCsv}
            >
              &#128229; Export to CSV
            </button>
          </div>
        </div>

        {isLoadingCandidates ? (
          <div className="empty-state">
            <p>Loading candidate evaluation records...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">&#128269;</div>
            <h4>No Evaluated Candidates Found</h4>
            <p>
              Upload PDF or DOCX resumes above to parse candidate profiles and generate explainable fit scores.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Rank</th>
                  <th>Candidate</th>
                  <th>Match Score</th>
                  <th>Breakdown (Tech / Proj / Edu)</th>
                  <th>Matching Skills</th>
                  <th>Shortlist</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((c, idx) => {
                  const rank = idx + 1;
                  const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';

                  return (
                    <tr
                      key={c.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelectCandidate(c)}
                    >
                      <td>
                        <span className={`rank-badge ${rankClass}`}>{rank}</span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{c.candidate_name}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          {c.candidate_email || c.filename} &bull; <span className="badge-tag" style={{ fontSize: '0.65rem' }}>{c.file_type}</span>
                        </div>
                      </td>

                      <td>
                        <div className="score-cell">
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: '42px' }}>
                            {c.match_score}%
                          </span>
                          <div className="score-bar-bg">
                            <div
                              className="score-bar-fill"
                              style={{ width: `${Math.min(c.match_score, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          Tech: <strong>{c.score_breakdown?.technical_score}%</strong> &bull; Proj:{' '}
                          <strong>{c.score_breakdown?.experience_project_score}%</strong> &bull; Edu:{' '}
                          <strong>{c.score_breakdown?.education_score}%</strong>
                        </div>
                      </td>

                      <td>
                        <div className="skill-tag-group">
                          {c.matching_skills.slice(0, 4).map((s, i) => (
                            <span key={i} className="skill-pill">
                              {s}
                            </span>
                          ))}
                          {c.matching_skills.length > 4 && (
                            <span className="skill-pill" style={{ opacity: 0.7 }}>
                              +{c.matching_skills.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <button
                          className={`btn-shortlist ${c.is_shortlisted ? 'shortlisted' : ''}`}
                          onClick={(e) => handleToggleShortlist(c, e)}
                        >
                          {c.is_shortlisted ? '&#10004; Shortlisted' : '+ Shortlist'}
                        </button>
                      </td>

                      <td>
                        <button
                          className="btn-icon-subtle"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidate(c);
                          }}
                        >
                          Analysis &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
