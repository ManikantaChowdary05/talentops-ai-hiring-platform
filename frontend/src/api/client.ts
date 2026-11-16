const BASE_URL = 'http://localhost:8000/api/v1';

export class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('tf360_token', token);
    } else {
      localStorage.removeItem('tf360_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('tf360_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errDetail = 'An error occurred';
        try {
          const errData = await response.json();
          errDetail = errData.detail || errData.message || JSON.stringify(errData);
        } catch (_) {
          errDetail = response.statusText;
        }
        throw new Error(typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail));
      }

      return await response.json();
    } catch (err: any) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth
  async login(username: string, password: string = "DemoPassword123!") {
    return this.request<any>('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getRoles() {
    return this.request<any[]>('/auth/roles-list');
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Dashboard & Analytics
  async getDashboard(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any>(`/analytics/dashboard${qs ? '?' + qs : ''}`);
  }

  // Requisitions
  async getRequisitions(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/requisitions${qs ? '?' + qs : ''}`);
  }

  async getRequisition(id: string) {
    return this.request<any>(`/requisitions/${id}`);
  }

  async createRequisition(data: any) {
    return this.request<any>('/requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveRequisition(id: string) {
    return this.request<any>(`/requisitions/${id}/approve`, {
      method: 'PATCH',
    });
  }

  // Candidates
  async getCandidates(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/candidates${qs ? '?' + qs : ''}`);
  }

  async getCandidate(id: string) {
    return this.request<any>(`/candidates/${id}`);
  }

  async createCandidate(data: any) {
    return this.request<any>('/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAiCandidateFit(candidateId: string, requisitionId: string) {
    return this.request<any>(`/candidates/${candidateId}/ai-fit/${requisitionId}`);
  }

  // Applications
  async getApplications(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/applications${qs ? '?' + qs : ''}`);
  }

  async getApplication(id: string) {
    return this.request<any>(`/applications/${id}`);
  }

  async getStageHistory(id: string) {
    return this.request<any[]>(`/applications/${id}/history`);
  }

  async createApplication(data: any) {
    return this.request<any>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async transitionStage(applicationId: string, newStage: string, decisionReason: string) {
    return this.request<any>(`/applications/${applicationId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ new_stage: newStage, decision_reason: decisionReason }),
    });
  }

  // Interviews & Scheduling
  async getInterviews(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/interviews${qs ? '?' + qs : ''}`);
  }

  async getPanels() {
    return this.request<any[]>('/interviews/panels');
  }

  async getAvailabilities(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/interviews/availabilities${qs ? '?' + qs : ''}`);
  }

  async scheduleInterview(data: any) {
    return this.request<any>('/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelInterview(id: string, reason: string) {
    return this.request<any>(`/interviews/${id}/cancel?reason=${encodeURIComponent(reason)}`, {
      method: 'PATCH',
    });
  }

  // Evaluations & Scorecards
  async getScorecards(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/evaluations${qs ? '?' + qs : ''}`);
  }

  async submitScorecard(data: any) {
    return this.request<any>('/evaluations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScorecardSummary(interviewId: string) {
    return this.request<any>(`/evaluations/summary/${interviewId}`);
  }

  // Offers & Approvals
  async getOffers(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/offers${qs ? '?' + qs : ''}`);
  }

  async createOffer(data: any) {
    return this.request<any>('/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOfferStatus(offerId: string, status: string) {
    return this.request<any>(`/offers/${offerId}/status?target_status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    });
  }

  async getApprovals(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/approvals${qs ? '?' + qs : ''}`);
  }

  async submitApprovalAction(approvalId: string, decision: string, comments: string = '') {
    return this.request<any>(`/approvals/${approvalId}/action`, {
      method: 'POST',
      body: JSON.stringify({ decision, comments }),
    });
  }

  // Exceptions & Governance
  async getExceptions(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/exceptions${qs ? '?' + qs : ''}`);
  }

  async resolveException(exceptionId: string, status: string, comments: string) {
    return this.request<any>(`/exceptions/${exceptionId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution_status: status, comments }),
    });
  }

  async getAiExceptionDiagnosis(exceptionId: string) {
    return this.request<any>(`/exceptions/${exceptionId}/ai-diagnosis`);
  }

  // Audit
  async getAuditLogs(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/audit${qs ? '?' + qs : ''}`);
  }

  // AI Copilot
  async queryCopilot(query: string, context?: any) {
    return this.request<any>('/copilot/query', {
      method: 'POST',
      body: JSON.stringify({ query, context }),
    });
  }

  // Synthetic & Settings
  async generateSynthetic(mode: string) {
    return this.request<any>(`/synthetic/generate?mode=${mode}`, {
      method: 'POST',
    });
  }

  async getValidationReport() {
    return this.request<any>('/synthetic/validate');
  }

  async getRulesConfig() {
    return this.request<any>('/synthetic/rules-config');
  }

  async updateRulesConfig(data: any) {
    return this.request<any>('/synthetic/rules-config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
