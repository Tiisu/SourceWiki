const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.saveTokens(data.accessToken, this.refreshToken!);
        return true;
      }
      
      this.clearTokens();
      return false;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      // If unauthorized and we have a refresh token, try to refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.saveTokens(accessToken, refreshToken);
  }

  clearAuth() {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const api = new ApiClient(API_URL);

// Auth API
export const authApi = {
  register: (username: string, email: string, password: string, country: string) =>
    api.post('/auth/register', { username, email, password, country }),

  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/me'),

  updateProfile: (email: string, country: string) =>
    api.put('/auth/profile', { email, country }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
};

// Submission API
export const submissionApi = {
  create: (data: {
    url: string;
    title: string;
    publisher: string;
    country: string;
    category: string;
    wikipediaArticle?: string;
    fileType?: string;
    fileName?: string;
  }) => api.post('/submissions', data),

  getAll: (params?: {
    country?: string;
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get(`/submissions?${query.toString()}`);
  },

  getById: (id: string) => api.get(`/submissions/${id}`),

  getMy: (page = 1, limit = 20) =>
    api.get(`/submissions/my/submissions?page=${page}&limit=${limit}`),

  update: (id: string, data: any) => api.put(`/submissions/${id}`, data),

  delete: (id: string) => api.delete(`/submissions/${id}`),

  verify: (id: string, status: string, verifierNotes?: string) =>
    api.put(`/submissions/${id}/verify`, { status, verifierNotes }),

  getPendingForCountry: (page = 1, limit = 20) =>
    api.get(`/submissions/pending/country?page=${page}&limit=${limit}`),

  getStats: (country?: string) => {
    const query = country ? `?country=${country}` : '';
    return api.get(`/submissions/stats${query}`);
  },
};

// User API
export const userApi = {
  getProfile: (id: string) => api.get(`/users/${id}`),

  getLeaderboard: (country?: string, limit = 20) => {
    const query = new URLSearchParams();
    if (country) query.append('country', country);
    query.append('limit', String(limit));
    return api.get(`/users/leaderboard?${query.toString()}`);
  },

  getAll: (params?: {
    role?: string;
    country?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get(`/users?${query.toString()}`);
  },

  awardBadge: (id: string, name: string, icon: string) =>
    api.post(`/users/${id}/badge`, { name, icon }),

  updateRole: (id: string, role: string) =>
    api.put(`/users/${id}/role`, { role }),

  deactivate: (id: string) => api.put(`/users/${id}/deactivate`),

  activate: (id: string) => api.put(`/users/${id}/activate`),
};

export default api;
