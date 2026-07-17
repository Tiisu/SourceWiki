// Simple centralized API client for SourceWiki
// Includes: Admin endpoints, Settings, Audit logs, Auth, and Submissions

export type ApiResult<T> = { success: true; data: T } | { success: false; error: string };

const BASE = import.meta.env.VITE_API_URL ?? '';
const DEV_USER_HEADER = import.meta.env.VITE_DEV_USER ?? '';

function buildHeaders(isJson = true): HeadersInit {
  const h: HeadersInit = {};
  if (isJson) h['Content-Type'] = 'application/json';
  
  // Auth Token handling
  const token = localStorage.getItem('token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  
  if (DEV_USER_HEADER) h['x-dev-user'] = DEV_USER_HEADER;
  return h;
}

// Core Fetch Function
async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    // Handle FormData automatically
    const isFormData = opts.body instanceof FormData;
    
    const res = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      ...opts,
      headers: {
        ...(opts.headers ?? {}),
        ...buildHeaders(!isFormData),
      },
    });
    
    // Handle empty responses
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    
    if (!res.ok) return { success: false, error: data?.message ?? res.statusText };
    return { success: true, data: data as T };
  } catch (err) {
    return { success: false, error: (err as Error).message || 'Network error' };
  }
}

// --- 1. GENERAL API EXPORT ---
export const api = {
  get: <T>(url: string) => apiFetch<T>(url, { method: 'GET' }),
  post: <T>(url: string, data: any) => apiFetch<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(url: string, data: any) => apiFetch<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(url: string, data: any) => apiFetch<T>(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: 'DELETE' }),
};

/* --- TYPES --- */
export type User = {
  id: string;
  username: string;
  email: string;
  country?: string;
  role: 'admin' | 'verifier' | 'contributor';
  points?: number;
  badges?: string[];
  joinDate?: string;
};

export type Settings = {
  _id?: string;
  siteName: string;
  verificationPoints: number;
  maxSubmissionsPerDay: number;
  updatedAt?: string;
};

export type AuditLog = {
  _id: string;
  action: string;
  resource?: string;
  method?: string;
  user?: { id?: string; username?: string } | null;
  details?: any;
  createdAt: string;
};

/* --- 2. AUTH API --- */
export const authApi = {
  login: (credentials: any) => apiFetch<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data: any) => apiFetch<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiFetch<{success: boolean}>('/api/auth/logout', { method: 'POST' }),
  getCurrentUser: () => apiFetch<User>('/api/auth/me'),
};

/* --- 3. SUBMISSION API --- */
export const submissionApi = {
  getAll: () => apiFetch<any[]>('/api/submissions'),
  getById: (id: string) => apiFetch<any>(`/api/submissions/${id}`),
  create: (data: any) => apiFetch<any>('/api/submissions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/api/submissions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<{success: boolean}>(`/api/submissions/${id}`, { method: 'DELETE' }),
};

/* --- 4. PUBLIC USER API --- */
export const userApi = {
  getAll: () => apiFetch<User[]>('/api/users'), 
  getProfile: (id: string) => apiFetch<User>(`/api/users/${id}`),
  updateProfile: (data: any) => apiFetch<User>('/api/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
};

/* --- 5. HACKATHON LOGIC (Admin/Settings/Audit) --- */

/* Admin - Users */
export const adminApi = {
  listUsers: async (): Promise<ApiResult<User[]>> => apiFetch<User[]>('/api/admin/users'),
  createUser: async (payload: Partial<User>): Promise<ApiResult<User>> =>
    apiFetch<User>('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: async (id: string, payload: Partial<User>): Promise<ApiResult<User>> =>
    apiFetch<User>(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteUser: async (id: string): Promise<ApiResult<{ success: boolean }>> =>
    apiFetch<{ success: boolean }>(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

/* Settings */
export const settingsApi = {
  getSettings: async (): Promise<ApiResult<Settings>> => apiFetch<Settings>('/api/admin/settings'),
  updateSettings: async (payload: Partial<Settings>): Promise<ApiResult<Settings>> =>
    apiFetch<Settings>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(payload) }),
};

/* Audit logs */
export const auditApi = {
  listAuditLogs: async (params?: { action?: string; user?: string }): Promise<ApiResult<AuditLog[]>> => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set('action', params.action);
    if (params?.user) qs.set('user', params.user);
    const path = `/api/admin/audit-logs${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiFetch<AuditLog[]>(path);
  },
};

export default { api, authApi, submissionApi, userApi, adminApi, settingsApi, auditApi };