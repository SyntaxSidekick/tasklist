/**
 * Demo API - LocalStorage-based API for GitHub Pages demo
 * This provides a fully functional demo without requiring a backend
 */

import type { Task, Project, User } from '@/types';

const STORAGE_KEYS = {
  USER: 'demo_user',
  TASKS: 'demo_tasks',
  PROJECTS: 'demo_projects',
  TOKEN: 'demo_token',
};

// Demo user
const DEMO_USER: User = {
  id: 1,
  email: 'demo@syntaxsidekick.com',
  name: 'Demo User',
  created_at: new Date().toISOString(),
};

// Initialize demo data on first load
const initializeDemoData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEMO_USER));
    localStorage.setItem(STORAGE_KEYS.TOKEN, 'demo-token-12345');
  }

  if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
    const demoProjects: Project[] = [
      {
        id: 1,
        name: 'Personal',
        description: 'Personal tasks and errands',
        color: '#10B981',
        user_id: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Work',
        description: 'Work-related tasks',
        color: '#3B82F6',
        user_id: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Side Projects',
        description: 'Personal coding projects',
        color: '#8B5CF6',
        user_id: 1,
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(demoProjects));
  }

  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const demoTasks: Task[] = [
      {
        id: 1,
        title: 'Try the voice assistant',
        description: 'Click the "Data" button and say "Hey Data" to activate the voice assistant!',
        due_date: today.toISOString().split('T')[0],
        due_time: '10:00',
        priority: 1,
        completed: false,
        project_id: 1,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Review weekly calendar view',
        description: 'Check out the weekly calendar to see time-based task scheduling',
        due_date: today.toISOString().split('T')[0],
        due_time: '14:00',
        priority: 2,
        completed: false,
        project_id: 1,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 3,
        title: 'Test the Pomodoro timer',
        description: 'Try the built-in Pomodoro timer for focused work sessions',
        due_date: tomorrow.toISOString().split('T')[0],
        due_time: '09:00',
        priority: 3,
        completed: false,
        project_id: 2,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 4,
        title: 'Create a new project',
        description: 'Go to Projects page and create your own project',
        due_date: tomorrow.toISOString().split('T')[0],
        due_time: '15:30',
        priority: 2,
        completed: false,
        project_id: 3,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 5,
        title: 'Add a task with voice',
        description: 'Say "Hey Data, add task buy groceries tomorrow at 3pm"',
        due_date: nextWeek.toISOString().split('T')[0],
        due_time: '11:00',
        priority: 1,
        completed: false,
        project_id: 1,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(demoTasks));
  }
};

// Helper to get next ID
const getNextId = (items: any[]): number => {
  return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
};

// Simulate API delay
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Demo API implementation
export const demoApi = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      await delay(300);
      initializeDemoData();
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      return {
        success: true,
        data: { user, token },
      };
    },

    register: async (email: string, password: string, name: string) => {
      await delay(300);
      initializeDemoData();
      const user = { ...DEMO_USER, email, name };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      return {
        success: true,
        data: { user, token },
      };
    },

    logout: async () => {
      await delay(100);
      // Don't clear data in demo mode, just simulate logout
      return { success: true };
    },

    getCurrentUser: async () => {
      await delay(100);
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
      return {
        success: true,
        data: { user },
      };
    },
  },

  // Tasks
  tasks: {
    getAll: async () => {
      await delay(200);
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      return {
        success: true,
        data: { tasks },
      };
    },

    getToday: async () => {
      await delay(200);
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const today = new Date().toISOString().split('T')[0];
      const filtered = tasks.filter((t: Task) => t.due_date === today);
      return {
        success: true,
        data: { tasks: filtered },
      };
    },

    getUpcoming: async () => {
      await delay(200);
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const filtered = tasks.filter((t: Task) => {
        const taskDate = new Date(t.due_date);
        return taskDate >= today && taskDate <= nextWeek;
      });
      return {
        success: true,
        data: { tasks: filtered },
      };
    },

    getByProject: async (projectId: number) => {
      await delay(200);
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const filtered = tasks.filter((t: Task) => t.project_id === projectId);
      return {
        success: true,
        data: { tasks: filtered },
      };
    },

    create: async (taskData: Partial<Task>) => {
      await delay(300);
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const newTask: Task = {
        id: getNextId(tasks),
        user_id: DEMO_USER.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed: false,
        ...taskData,
      } as Task;
      tasks.push(newTask);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return {
        success: true,
        data: { task: newTask },
      };
    },

    update: async (id: number, taskData: Partial<Task>) => {
      await delay(300);
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const index = tasks.findIndex((t: Task) => t.id === id);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          ...taskData,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
        return {
          success: true,
          data: { task: tasks[index] },
        };
      }
      return { success: false, error: 'Task not found' };
    },

    delete: async (id: number) => {
      await delay(300);
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const filtered = tasks.filter((t: Task) => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
      return { success: true };
    },

    toggle: async (id: number) => {
      await delay(300);
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const index = tasks.findIndex((t: Task) => t.id === id);
      if (index !== -1) {
        tasks[index].completed = !tasks[index].completed;
        tasks[index].updated_at = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
        return {
          success: true,
          data: { task: tasks[index] },
        };
      }
      return { success: false, error: 'Task not found' };
    },
  },

  // Projects
  projects: {
    getAll: async () => {
      await delay(200);
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
      return {
        success: true,
        data: { projects },
      };
    },

    getById: async (id: number) => {
      await delay(200);
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
      const project = projects.find((p: Project) => p.id === id);
      return {
        success: true,
        data: { project },
      };
    },

    create: async (projectData: Partial<Project>) => {
      await delay(300);
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
      const newProject: Project = {
        id: getNextId(projects),
        user_id: DEMO_USER.id,
        created_at: new Date().toISOString(),
        ...projectData,
      } as Project;
      projects.push(newProject);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      return {
        success: true,
        data: { project: newProject },
      };
    },

    update: async (id: number, projectData: Partial<Project>) => {
      await delay(300);
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
      const index = projects.findIndex((p: Project) => p.id === id);
      if (index !== -1) {
        projects[index] = {
          ...projects[index],
          ...projectData,
        };
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
        return {
          success: true,
          data: { project: projects[index] },
        };
      }
      return { success: false, error: 'Project not found' };
    },

    delete: async (id: number) => {
      await delay(300);
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
      const filtered = projects.filter((p: Project) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
      return { success: true };
    },
  },
};

// Initialize on import
if (typeof window !== 'undefined') {
  initializeDemoData();
}
