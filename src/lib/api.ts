import type { 
  ApiResponse, 
  User, 
  Task, 
  Project, 
  Section, 
  Label, 
  Reminder, 
  PomodoroSession, 
  PomodoroStats, 
  Notification 
} from '@/types';
import { demoApi } from './demo-api';

const API_BASE_URL = '/api';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for cookies
    };
    
    try {
      const response = await fetch(url, config);
      
      // Get response text first
      const text = await response.text();
      
      // Try to parse as JSON
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response text:', text);
        throw new Error(`Invalid JSON response from ${endpoint}: ${text.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        // For auth errors, just throw a simple error without logging
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      
      return data;
    } catch (error) {
      // Only log non-auth errors
      if (error instanceof Error && error.message !== 'Unauthorized') {
        console.error('API Error:', error);
      }
      throw error;
    }
  }
  
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
IS_DEMO_MODE ? demoApi.auth : 
// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<{ user: User; token: string }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/login', data),
  logout: () => api.post<{}>('/auth/logout'),
  me: () => api.get<{ user: User }>('/auth/me'),
};

// Tasks API
export const tasksApi = IS_DEMO_MODE ? {
  ...demoApi.tasks,
  getAll: demoApi.tasks.getAll,
  getById: (id: number) => demoApi.tasks.getAll().then(res => ({ 
    success: true, 
    data: { task: res.data?.tasks.find((t: Task) => t.id === id) } 
  })),
  complete: (id: number) => demoApi.tasks.toggle(id),
  uncomplete: (id: number) => demoApi.tasks.toggle(id),
  reorder: async () => ({ success: true }), // Not implemented in demo
  getByProject: demoApi.tasks.getByProject,
} : {
  getAll: (params?: { project_id?: number; section_id?: number; completed?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<{ tasks: Task[] }>(`/tasks${query ? `?${query}` : ''}`);
  },
  getToday: () => api.get<{ tasks: Task[] }>('/tasks/today'),
  getUpcoming: () => api.get<{ tasks: Task[] }>('/tasks/upcoming'),
  getById: (id: number) => IS_DEMO_MODE ? demoApi.projects : api.get<{ task: Task }>(`/tasks/${id}`),
  create: (data: any) => api.post<{ task: Task }>('/tasks', data),
  update: (id: number, data: any) => api.put<{ task: Task }>(`/tasks/${id}`, data),
  complete: (id: number) => api.patch<{ task: Task }>(`/tasks/${id}/complete`),
  uncomplete: (id: number) => api.patch<{ task: Task }>(`/tasks/${id}/uncomplete`),
  delete: (id: number) => api.delete<{}>(`/tasks/${id}`),
  reorder: (tasks: Array<{ id: number; order_index: number }>) =>
    api.post<{}>('/tasks/reorder', { tasks }),
};

// Projects API
export const projectsApi = {
  getAll: () => api.get<{ projects: Project[] }>('/projects'),
  getById: (id: number) => api.get<{ project: Project }>(`/projects/${id}`),
  create: (data: any) => api.post<{ project: Project }>('/projects', data),
  update: (id: number, data: any) => api.put<{ project: Project }>(`/projects/${id}`, data),
  delete: (id: number) => api.delete<{}>(`/projects/${id}`),
  reorder: (id: number, orderIndex: number) =>
    api.post<{}>(`/projects/${id}/reorder`, { order_index: orderIndex }),
};

// Sections API
export const sectionsApi = {
  getAll: (projectId: number) => api.get<{ sections: Section[] }>(`/projects/${projectId}/sections`),
  create: (projectId: number, data: any) =>
    api.post<{ section: Section }>(`/projects/${projectId}/sections`, data),
  update: (id: number, data: any) => api.put<{ section: Section }>(`/sections/${id}`, data),
  delete: (id: number) => api.delete<{}>(`/sections/${id}`),
};

// Labels API
export const labelsApi = {
  getAll: () => api.get<{ labels: Label[] }>('/labels'),
  create: (data: any) => api.post<{ label: Label }>('/labels', data),
  update: (id: number, data: any) => api.put<{ label: Label }>(`/labels/${id}`, data),
  delete: (id: number) => api.delete<{}>(`/labels/${id}`),
};

// Reminders API
export const remindersApi = {
  getUpcoming: () => api.get<{ reminders: Reminder[] }>('/reminders/upcoming'),
  create: (taskId: number, data: any) =>
    api.post<{ reminder: Reminder }>(`/tasks/${taskId}/reminders`, data),
  delete: (id: number) => api.delete<{}>(`/reminders/${id}`),
};

// Pomodoro API
export const pomodoroApi = {
  getStats: (period: 'day' | 'week' | 'month' = 'week') =>
    api.get<{ stats: PomodoroStats }>(`/pomodoro/stats?period=${period}`),
  getSessions: (limit = 20) => api.get<{ sessions: PomodoroSession[] }>(`/pomodoro/sessions?limit=${limit}`),
  createSession: (data: any) => api.post<{ session: PomodoroSession }>('/pomodoro/sessions', data),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { unread_only?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<{ notifications: Notification[]; unread_count: number }>(`/notifications${query ? `?${query}` : ''}`);
  },
  markAsRead: (id: number) => api.patch<{ notification: Notification }>(`/notifications/${id}/read`),
  markAllAsRead: () => api.post<{}>('/notifications/read-all'),
  delete: (id: number) => api.delete<{}>(`/notifications/${id}`),
};

// Users API
export const usersApi = {
  getProfile: () => api.get<{ user: User }>('/users/profile'),
  updateProfile: (data: any) => api.put<{ user: User }>('/users/profile', data),
};
