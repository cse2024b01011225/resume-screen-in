/**
 * API Service for communicating with FastAPI Backend.
 * Uses smart endpoint resolution:
 * 1. Checks relative '/api' (proxied by Vite to avoid CORS)
 * 2. Falls back to direct 'http://127.0.0.1:8000/api' or 'http://localhost:8000/api'
 */

let resolvedBaseUrl = null;

async function getWorkingBaseUrl() {
  if (resolvedBaseUrl !== null) {
    return resolvedBaseUrl;
  }

  // Candidate base URLs to probe
  const candidates = [
    '', // Relative URL (uses Vite proxy)
    'http://127.0.0.1:8000',
    'http://localhost:8000',
  ];

  for (const base of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${base}/api/health`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        resolvedBaseUrl = base;
        return base;
      }
    } catch (e) {
      // Continue probing other candidate base URLs
    }
  }

  // Default to relative if none responded yet
  return '';
}

/**
 * Perform a fetch with automatic base URL discovery and error formatting.
 */
async function apiRequest(endpoint, options = {}) {
  const base = await getWorkingBaseUrl();
  const url = `${base}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      let errorMsg = `Server responded with ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorMsg = Array.isArray(errorJson.detail)
            ? errorJson.detail.map(d => d.msg).join(', ')
            : errorJson.detail;
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err) {
    // If request failed, reset resolvedBaseUrl so it probes again next time
    resolvedBaseUrl = null;
    throw err;
  }
}

/**
 * Fetch operational health status from backend.
 */
export async function checkBackendHealth() {
  const startTime = performance.now();
  const candidates = ['', 'http://127.0.0.1:8000', 'http://localhost:8000'];

  for (const base of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`${base}/api/health`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        const data = await response.json();
        resolvedBaseUrl = base;
        return { ok: true, data, latencyMs, baseUrl: base || 'Vite Proxy' };
      }
    } catch (_) {}
  }

  const latencyMs = Math.round(performance.now() - startTime);
  return {
    ok: false,
    error: 'Backend is offline. Ensure FastAPI is running on port 8000.',
    latencyMs,
  };
}

/**
 * Fetch system-wide metrics and recent job requisitions.
 */
export async function getStats() {
  return await apiRequest('/api/stats');
}

/**
 * List all job requisitions.
 */
export async function getJobs() {
  return await apiRequest('/api/jobs');
}

/**
 * Get single job requisition details.
 */
export async function getJob(jobId) {
  return await apiRequest(`/api/jobs/${jobId}`);
}

/**
 * Create a new job requisition.
 */
export async function createJob(jobData) {
  return await apiRequest('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData),
  });
}

/**
 * Delete a job requisition.
 * @param {number|string} jobId
 * @param {boolean} force - Force deletion even if candidates are associated
 */
export async function deleteJob(jobId, force = false) {
  const query = force ? '?force=true' : '';
  return await apiRequest(`/api/jobs/${jobId}${query}`, {
    method: 'DELETE',
  });
}

/**
 * Upload multiple resume files (PDF, DOCX) and screen candidates against job.
 */
export async function uploadResumes(jobId, files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  return await apiRequest(`/api/jobs/${jobId}/resumes`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Get all evaluated candidates for a job.
 */
export async function getJobCandidates(jobId) {
  return await apiRequest(`/api/jobs/${jobId}/candidates`);
}

/**
 * Get detailed analysis for a single candidate.
 */
export async function getCandidateAnalysis(candidateId) {
  return await apiRequest(`/api/candidates/${candidateId}`);
}

/**
 * Toggle shortlisting status for a candidate.
 */
export async function toggleCandidateShortlist(candidateId, isShortlisted) {
  return await apiRequest(`/api/candidates/${candidateId}/shortlist`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_shortlisted: isShortlisted }),
  });
}

/**
 * Generates the direct download link for exporting candidates to CSV.
 */
export function getExportCsvUrl(jobId) {
  const base = resolvedBaseUrl || '';
  return `${base}/api/jobs/${jobId}/export-csv`;
}
