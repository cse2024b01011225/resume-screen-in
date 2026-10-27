import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './components/DashboardPage';
import ScreeningPage from './components/ScreeningPage';
import CandidateAnalysisPage from './components/CandidateAnalysisPage';
import AboutPage from './components/AboutPage';
import { checkBackendHealth, getStats, getJobs, deleteJob } from './services/api';
import './App.css';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' | 'screening' | 'analysis'
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [health, setHealth] = useState({
    status: 'loading',
    data: null,
    error: null,
    latencyMs: 0,
    baseUrl: '',
    lastChecked: null,
  });

  // Health ping
  const fetchHealth = useCallback(async () => {
    setHealth((prev) => ({ ...prev, status: 'loading' }));
    const result = await checkBackendHealth();
    if (result.ok) {
      setHealth({
        status: 'connected',
        data: result.data,
        error: null,
        latencyMs: result.latencyMs,
        baseUrl: result.baseUrl,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } else {
      setHealth({
        status: 'disconnected',
        data: null,
        error: result.error,
        latencyMs: result.latencyMs,
        baseUrl: '',
        lastChecked: new Date().toLocaleTimeString(),
      });
    }
  }, []);

  // Fetch jobs & stats
  const fetchJobsAndStats = useCallback(async () => {
    try {
      const [jobsData, statsData] = await Promise.all([getJobs(), getStats()]);
      setJobs(jobsData);
      setStats(statsData);
      if (jobsData.length > 0 && !selectedJobId) {
        setSelectedJobId(jobsData[0].id);
      }
    } catch (err) {
      console.warn('Failed to fetch jobs/stats from backend:', err.message);
    }
  }, [selectedJobId]);

  useEffect(() => {
    fetchHealth();
    fetchJobsAndStats();

    const healthInterval = setInterval(fetchHealth, 15000);
    return () => clearInterval(healthInterval);
  }, [fetchHealth, fetchJobsAndStats]);

  const handleNavigateToScreening = (jobId = null) => {
    if (jobId) {
      setSelectedJobId(jobId);
    }
    setActivePage('screening');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setActivePage('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCandidateUpdated = (updatedCandidate) => {
    setSelectedCandidate(updatedCandidate);
    fetchJobsAndStats();
  };

  const handleDeleteJob = async (jobId, force = false) => {
    await deleteJob(jobId, force);
    if (selectedJobId === jobId) {
      setSelectedJobId(null);
    }
    await fetchJobsAndStats();
  };

  return (
    <div className="app-container">
      {/* Persistent Navbar with Nav Tabs & Health Indicator */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        health={health}
        onRefreshHealth={fetchHealth}
        selectedCandidate={selectedCandidate}
      />

      {/* Navigable Page Views */}
      <main style={{ flex: 1 }}>
        {activePage === 'dashboard' && (
          <DashboardPage
            stats={stats}
            jobs={jobs}
            health={health}
            onRefreshStats={fetchJobsAndStats}
            onDeleteJob={handleDeleteJob}
            onNavigateToScreening={handleNavigateToScreening}
            onSelectCandidate={handleSelectCandidate}
          />
        )}

        {activePage === 'screening' && (
          <ScreeningPage
            initialJobId={selectedJobId}
            jobs={jobs}
            onRefreshJobs={fetchJobsAndStats}
            onSelectCandidate={handleSelectCandidate}
          />
        )}

        {activePage === 'analysis' && (
          <CandidateAnalysisPage
            candidate={selectedCandidate}
            onBackToScreening={() => setActivePage('screening')}
            onCandidateUpdated={handleCandidateUpdated}
          />
        )}

        {activePage === 'about' && (
          <AboutPage
            onNavigateToScreening={() => handleNavigateToScreening()}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        Developed by Yash Tomar | HCL Capstone Project
      </footer>
    </div>
  );
}
