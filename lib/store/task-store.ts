/**
 * Task Store
 *
 * Story 2.8: Child Views Today's Task List
 * Task 2-6: 实现任务刷新机制
 * Task 4: 实现任务排序逻辑
 *
 * Zustand store for child task state management
 * Handles task loading, refreshing, error states, and sorting
 */

import { create } from 'zustand';
import { getTodayTasksByChild, getTaskProgressByChild, getTaskStatusDisplay, TaskSortOption } from '@/lib/db/queries/tasks';

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
  sortOption: TaskSortOption;

  // Actions
  fetchTasks: (childId: string) => Promise<void>;
  refreshTasks: (childId: string) => Promise<void>;
  setSortOption: (sort: TaskSortOption, childId?: string) => void;
  clearError: () => void;
}

/**
 * Shared logic to load tasks and progress
 * Extracted to avoid code duplication between fetchTasks and refreshTasks
 */
async function loadTasksAndProgress(
  childId: string,
  sortOption: TaskSortOption,
  storeSet: (partial: Partial<TaskState>) => void
) {
  storeSet({ error: null });

  try {
    const tasks = await getTodayTasksByChild(childId, sortOption);
    const progress = await getTaskProgressByChild(childId);

    // Add display status to each task
    const tasksWithDisplayStatus = tasks.map(task => ({
      ...task,
      displayStatus: getTaskStatusDisplay(task.status),
    }));

    storeSet({
      tasks: tasksWithDisplayStatus,
      progress,
      isLoading: false,
      isRefreshing: false,
    });
  } catch (error) {
    storeSet({
      error: error instanceof Error ? error.message : '加载任务失败',
      isLoading: false,
      isRefreshing: false,
    });
  }
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // Initial state
  tasks: [],
  progress: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  sortOption: 'created' as TaskSortOption,

  // Fetch tasks (initial load)
  fetchTasks: async (childId: string) => {
    set({ isLoading: true, error: null });
    await loadTasksAndProgress(childId, get().sortOption, set);
  },

  // Refresh tasks (pull-to-refresh or auto-refresh)
  refreshTasks: async (childId: string) => {
    set({ isRefreshing: true, error: null });
    await loadTasksAndProgress(childId, get().sortOption, set);
  },

  // Set sort option and refetch tasks
  setSortOption: async (sort: TaskSortOption, childId?: string) => {
    set({ sortOption: sort });

    // Refetch tasks with new sort option if childId is provided
    if (childId) {
      const tasks = await getTodayTasksByChild(childId, sort);
      const progress = await getTaskProgressByChild(childId);

      const tasksWithDisplayStatus = tasks.map(task => ({
        ...task,
        displayStatus: getTaskStatusDisplay(task.status),
      }));

      set({
        tasks: tasksWithDisplayStatus,
        progress,
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
