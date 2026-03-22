export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
}

export interface Project {
  id: number;
  user_id: number;
  name: string;
  color: string;
  icon?: string;
  is_favorite: boolean;
  view_style: 'list' | 'board';
  order_index: number;
  task_count?: number;
  active_task_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: number;
  project_id: number;
  name: string;
  order_index: number;
  task_count?: number;
  created_at: string;
}

export interface Label {
  id: number;
  user_id: number;
  name: string;
  color: string;
  task_count?: number;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  project_id?: number;
  section_id?: number;
  parent_task_id?: number;
  title: string;
  description?: string;
  priority: 1 | 2 | 3 | 4;
  due_date?: string;
  due_time?: string;
  completed: boolean;
  completed_at?: string;
  order_index: number;
  recurrence_rule?: RecurrenceRule;
  recurrence_parent_id?: number;
  project_name?: string;
  project_color?: string;
  label_ids?: string;
  label_names?: string;
  subtask_count?: number;
  completed_subtask_count?: number;
  subtasks?: Task[];
  created_at: string;
  updated_at: string;
}

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  days?: number[]; // For weekly recurrence
}

export interface Reminder {
  id: number;
  task_id: number;
  remind_at: string;
  is_sent: boolean;
  task_title?: string;
  priority?: number;
  created_at: string;
}

export interface PomodoroSession {
  id: number;
  user_id: number;
  task_id?: number;
  duration_minutes: number;
  completed: boolean;
  started_at: string;
  completed_at?: string;
  task_title?: string;
}

export interface PomodoroStats {
  total_sessions: number;
  completed_sessions: number;
  total_minutes: number;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message?: string;
  task_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  message?: string;
}
