import React from 'react';

export default function Navbar({
  activePage,
  setActivePage,
  health,
  onRefreshHealth,
  selectedCandidate,
}) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">AI</div>
        <div className="brand-title-wrap">
          <h1>
            Resume Screen-In
            <span className="badge-tag">HCL Capstone</span>
          </h1>
          <p className="brand-subtitle">
            AI-Powered Resume Screening &bull; Job Matching
          </p>
        </div>
      </div>

      {/* Main Nav Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activePage === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActivePage('dashboard')}
        >
          <span>&#128202;</span> Dashboard
        </button>

        <button
          className={`nav-tab-btn ${activePage === 'screening' ? 'active' : ''}`}
          onClick={() => setActivePage('screening')}
        >
          <span>&#128196;</span> Resume Screening
        </button>

        <button
          className={`nav-tab-btn ${activePage === 'analysis' ? 'active' : ''}`}
          onClick={() => setActivePage('analysis')}
          disabled={!selectedCandidate}
          title={!selectedCandidate ? 'Select a candidate from Resume Screening first' : 'View Candidate Analysis'}
          style={{ opacity: selectedCandidate ? 1 : 0.6 }}
        >
          <span>&#128269;</span> Candidate Analysis
          {selectedCandidate && (
            <span className="badge-tag badge-green" style={{ marginLeft: '4px' }}>
              {selectedCandidate.candidate_name.split(' ')[0]}
            </span>
          )}
        </button>

        <button
          className={`nav-tab-btn ${activePage === 'about' ? 'active' : ''}`}
          onClick={() => setActivePage('about')}
        >
          <span>&#8505;</span> About
        </button>
      </nav>

      {/* Health & Status Pill */}
      <div className="header-status">
        <div className={`connection-pill ${health.status}`}>
          <span className="status-dot"></span>
          <span>
            {health.status === 'connected' && `Backend Online (${health.latencyMs}ms)`}
            {health.status === 'disconnected' && 'Backend Disconnected'}
            {health.status === 'loading' && 'Checking Connection...'}
          </span>
        </div>

        <button
          className="btn-icon-subtle"
          onClick={onRefreshHealth}
          title="Refresh Backend Health"
        >
          &#x21bb; Ping Health
        </button>
      </div>
    </header>
  );
}
