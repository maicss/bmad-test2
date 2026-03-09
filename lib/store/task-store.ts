/**
 * Task Store
 *
 * Story 2.8: Child Views Today's Task List
 * Task 2-6: 实现任务刷新机制
 *
 * Zustand store for child task state management
 * Handles task loading, refreshing, error states
 */

import { create } from 'zustand';
import { getTodayTasksByChild, getTaskProgressByChild, getTaskStatusDisplay } from '@/lib/db/queries/tasks';

// Type definitions
export interface Task {
  id: string;
  title: string;
  task_type: string;
  points: number;
  status: string;
  displayStatus: 'pending' | 'completed' | 'pending_approval';
  scheduled_date: string;
}

export interface TaskProgress {
  completed: number;
  total: number;
  progress: number;
}

interface TaskState {
  // State
  tasks: Task[];
  progress: TaskProgress | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  fetchTasks: (childId: string) => Promise<void>;
  refreshTasks: (childId: string) => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  // Initial state
  tasks: [],
  progress: null,
  isLoading: false,
  isRefreshing: false,
  error: null,

  // Fetch tasks (initial load)
  fetchTasks: async (childId: string) => {
    set({ isLoading: true, error: null });

    try {
      const tasks = await getTodayTasksByChild(childId);
      const progress = await getTaskProgressByChild(childId);

      // Add display status to each task
      const tasksWithDisplayStatus = tasks.map(task => ({
        ...task,
        displayStatus: getTaskStatusDisplay(task.status),
      }));

      set({
        tasks: tasksWithDisplayStatus,
        progress,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载任务失败',
        isLoading: false,
      });
    }
  },

  // Refresh tasks (pull-to-refresh or auto-refresh)
  refreshTasks: async (childId: string) => {
    set({ isRefreshing: true, error: null });

    try {
      const tasks = await getTodayTasksByChild(childId);
      const progress = await getTaskProgressByChild(childId);

      const tasksWithDisplayStatus = tasks.map(task => ({
        ...task,
        displayStatus: getTaskStatusDisplay(task.status),
      }));

      set({
        tasks: tasksWithDisplayStatus,
        progress,
        isRefreshing: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '刷新任务失败',
        isRefreshing: false,
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
