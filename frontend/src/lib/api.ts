
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

class ApiClient {
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (reason: any) => void;
  }> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token!);
      }
    });
    
    this.failedQueue = [];
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.processQueue(null, data.accessToken);
        return data.accessToken;
      } else {
        this.processQueue(new Error('Token refresh failed'), null);
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      this.processQueue(error, null);
      throw error;
    } finally {
      this.isRefreshing = false;
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

    try {
      let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      // If unauthorized, try to refresh token
      if (response.status === 401) {
        try {
          const newToken = await this.refreshAccessToken();
          headers['Authorization'] = `Bearer ${newToken}`;
          
          response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        } catch (refreshError) {
          // Refresh failed, redirect to login or throw error
          throw new Error('Authentication required');
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

  clearAuth() {
    // Clear any pending refresh requests
    this.failedQueue = [];
  }

  isAuthenticated(): boolean {
    // For cookie-based auth, we need to check with the server
    // This is a simplified check - in a real app you might want
    // to ping the auth/me endpoint
    return true; // Will be validated server-side
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

  verify: (id: string, status: string, credibility?: string, verifierNotes?: string) => {
    console.log('🔴 API verify call:', { id, status, credibility, verifierNotes });
    console.log('🔴 API URL being used:', `${API_URL}/submissions/${id}/verify`);
    const payload = { status, credibility, verifierNotes };
    console.log('🔴 Payload being sent:', payload);
    return api.put(`/submissions/${id}/verify`, payload);
  },

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
