// Same-origin by default: in production the backend serves this app, and in
// development Vite proxies /api to the backend (see vite.config.ts).
const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface UserBadge {
  name: string;
  icon: string;
  earnedAt?: string;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  country: string;
  role: 'contributor' | 'verifier' | 'admin';
  points: number;
  badges: UserBadge[];
  joinDate: string;
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  accessToken: string;
  refreshToken: string;
  user: UserData;
}

export interface UserProfileResponse {
  success: boolean;
  message?: string;
  user: UserData;
}

export interface SubmissionData {
  id: string;
  url: string;
  title: string;
  publisher: string;
  country: string;
  category: string;
  wikipediaArticle?: string;
  fileType?: string;
  fileName?: string;
  status: 'pending' | 'verified' | 'rejected' | string;
  credibility?: 'primary' | 'secondary' | 'unreliable' | string;
  verifierNotes?: string;
  submittedBy?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionPayload {
  url: string;
  title: string;
  publisher: string;
  country: string;
  category: string;
  wikipediaArticle?: string;
  fileType?: string;
  fileName?: string;
}

export interface UpdateSubmissionPayload {
  url?: string;
  title?: string;
  publisher?: string;
  country?: string;
  category?: string;
  wikipediaArticle?: string;
  fileType?: string;
  fileName?: string;
  status?: string;
  credibility?: string;
  verifierNotes?: string;
}

export interface SubmissionsResponse {
  success: boolean;
  data?: SubmissionData[];
  submissions?: SubmissionData[];
  total?: number;
  page?: number;
  totalPages?: number;
  message?: string;
}

export interface SubmissionResponse {
  success: boolean;
  data?: SubmissionData;
  submission?: SubmissionData;
  message?: string;
}

export interface StatsResponse {
  success: boolean;
  stats?: Record<string, number>;
  totalSubmissions?: number;
  verifiedSubmissions?: number;
  rejectedSubmissions?: number;
  pendingSubmissions?: number;
  message?: string;
}

export interface LeaderboardUser {
  id: string;
  username: string;
  country: string;
  points: number;
  badges: UserBadge[];
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard?: LeaderboardUser[];
  data?: LeaderboardUser[];
  message?: string;
}

export interface UsersResponse {
  success: boolean;
  users?: UserData[];
  total?: number;
  page?: number;
  totalPages?: number;
  message?: string;
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

  async request<T = unknown>(
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

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let data: { message?: string; [key: string]: unknown };
      if (isJson) {
        try {
          data = await response.json();
        } catch (parseError) {
          throw new Error('Invalid JSON response from server');
        }
      } else {
        // For non-JSON responses, create a data object
        const text = await response.text();
        data = {
          success: response.ok,
          message: text || 'An error occurred',
        };
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        // Check for network errors
        if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
          throw new Error('Unable to connect to the server. Please check your connection.');
        }
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async get<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string): Promise<T> {
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
    api.post<AuthResponse>('/auth/register', { username, email, password, country }),

  login: (username: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { username, password }),

  logout: () => api.post<ApiResponse>('/auth/logout'),

  getMe: () => api.get<UserProfileResponse>('/auth/me'),

  updateProfile: (email: string, country: string) =>
    api.put<UserProfileResponse>('/auth/profile', { email, country }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<ApiResponse>('/auth/password', { currentPassword, newPassword }),
};

// Submission API
export const submissionApi = {
  create: (data: CreateSubmissionPayload) =>
    api.post<SubmissionResponse>('/submissions', data),

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
    return api.get<SubmissionsResponse>(`/submissions?${query.toString()}`);
  },

  getById: (id: string) => api.get<SubmissionResponse>(`/submissions/${id}`),

  getMy: (page = 1, limit = 20) =>
    api.get<SubmissionsResponse>(`/submissions/my/submissions?page=${page}&limit=${limit}`),

  update: (id: string, data: UpdateSubmissionPayload) =>
    api.put<SubmissionResponse>(`/submissions/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse>(`/submissions/${id}`),

  verify: (id: string, status: string, credibility?: string, verifierNotes?: string) => {
    const payload = { status, credibility, verifierNotes };
    return api.put<SubmissionResponse>(`/submissions/${id}/verify`, payload);
  },

  getPendingForCountry: (page = 1, limit = 20) =>
    api.get<SubmissionsResponse>(`/submissions/pending/country?page=${page}&limit=${limit}`),

  getStats: (country?: string) => {
    const query = country ? `?country=${country}` : '';
    return api.get<StatsResponse>(`/submissions/stats${query}`);
  },
};

// User API
export const userApi = {
  getProfile: (id: string) => api.get<UserProfileResponse>(`/users/${id}`),

  getLeaderboard: (country?: string, limit = 20) => {
    const query = new URLSearchParams();
    if (country) query.append('country', country);
    query.append('limit', String(limit));
    return api.get<LeaderboardResponse>(`/users/leaderboard?${query.toString()}`);
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
    return api.get<UsersResponse>(`/users?${query.toString()}`);
  },

  awardBadge: (id: string, name: string, icon: string) =>
    api.post<ApiResponse>(`/users/${id}/badge`, { name, icon }),

  updateRole: (id: string, role: string) =>
    api.put<ApiResponse>(`/users/${id}/role`, { role }),

  deactivate: (id: string) => api.put<ApiResponse>(`/users/${id}/deactivate`),

  activate: (id: string) => api.put<ApiResponse>(`/users/${id}/activate`),
};

export default api;
