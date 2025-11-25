// API Client for backend communication

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export interface FitnessMetric {
  id: number;
  userId: string;
  date: string;
  rhr?: number;
  hrv?: number;
  sleepScore?: number;
  sleepConsistency?: number;
  workoutIntensity?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  steps?: number;
  deepSleepMinutes?: number;
  spo2?: string;
  recoveryScore?: number;
}

export interface Insight {
  id: number;
  userId: string;
  content: string;
  type: string;
  generatedAt: string;
  isRead: boolean;
}

export interface GoogleFitStatus {
  connected: boolean;
  expiresAt?: string;
}

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      const errorMessage = error.message || `HTTP ${response.status}`;
      
      // Log detailed error info to console for debugging
      console.error(`[API Error] ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        errorType: error.errorType,
        details: error.details,
      });
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth endpoints
  async getUser(): Promise<User> {
    return this.request<User>('/auth/user');
  }

  // Google Fit endpoints
  async getGoogleFitStatus(): Promise<GoogleFitStatus> {
    return this.request<GoogleFitStatus>('/google-fit/status');
  }

  async getGoogleFitAuthUrl(): Promise<{ authUrl: string }> {
    return this.request<{ authUrl: string }>('/google-fit/connect');
  }

  async disconnectGoogleFit(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/google-fit/disconnect', {
      method: 'DELETE',
    });
  }

  async syncGoogleFit(startDate?: string, endDate?: string): Promise<{ success: boolean; synced: number; message: string }> {
    return this.request('/google-fit/sync', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate }),
    });
  }

  // Fitness metrics endpoints
  async getMetrics(days: number = 30): Promise<FitnessMetric[]> {
    return this.request<FitnessMetric[]>(`/metrics?days=${days}`);
  }

  async saveMetric(metric: Partial<FitnessMetric>): Promise<FitnessMetric> {
    return this.request<FitnessMetric>('/metrics', {
      method: 'POST',
      body: JSON.stringify(metric),
    });
  }

  // Insights endpoints
  async getLatestInsight(): Promise<Insight> {
    return this.request<Insight>('/insights/latest');
  }

  async generateInsight(): Promise<{ content: string }> {
    return this.request<{ content: string }>('/insights/generate', {
      method: 'POST',
    });
  }

  async markInsightAsRead(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/insights/${id}/read`, {
      method: 'PATCH',
    });
  }
}

export const api = new ApiClient();
