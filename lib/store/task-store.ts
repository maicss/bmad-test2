/**
 * Task Store
 *
 * Story 2.8: Child Views Today's Task List
 * Task 2-6: 实现任务刷新机制
 * Task 4: 实现任务排序逻辑
 *
 * Story 2.9: Child Marks Task Complete
 * Task 6: Implement optimistic UI updates
 * Task 7: Integrate task completion into TaskCard
 *
 * Zustand store for child task state management
 * Handles task loading, refreshing, error states, sorting, and completion
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
  isCompleting: boolean;
  error: string | null;
  sortOption: TaskSortOption;

  // Actions
  fetchTasks: (childId: string) => Promise<void>;
  refreshTasks: (childId: string) => Promise<void>;
  setSortOption: (sort: TaskSortOption, childId?: string) => void;
  clearError: () => void;
  completeTask: (taskId: string, proofImage?: string) => Promise<{ success: boolean; message: string; pointsAwarded?: number }>;
  updateTaskStatus: (taskId: string, status: string) => void;
  rollbackTaskStatus: (taskId: string, previousStatus: string) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // Initial state
  tasks: [],
  progress: null,
  isLoading: false,
  isRefreshing: false,
  isCompleting: false,
  error: null,
  sortOption: 'created' as TaskSortOption,

  // Fetch tasks (initial load)
  fetchTasks: async (childId: string) => {
    set({ isLoading: true, error: null });

    try {
      const sortOption = useTaskStore.getState().sortOption;
      const tasks = await getTodayTasksByChild(childId, sortOption);
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
      const sortOption = useTaskStore.getState().sortOption;
      const tasks = await getTodayTasksByChild(childId, sortOption);
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

  // Optimistically update task status
  updateTaskStatus: (taskId: string, status: string) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status,
              displayStatus: getTaskStatusDisplay(status),
            }
          : task
      ),
    }));
  },

  // Rollback task status on error
  rollbackTaskStatus: (taskId: string, previousStatus: string) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: previousStatus,
              displayStatus: getTaskStatusDisplay(previousStatus),
            }
          : task
      ),
    }));
  },

  // Complete task with optimistic update
  completeTask: async (taskId: string, proofImage?: string) => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);

    if (!task) {
      return { success: false, message: '任务不存在' };
    }

    if (task.status !== 'pending') {
      return { success: false, message: '任务已完成或正在处理中' };
    }

    const previousStatus = task.status;

    // Optimistic update: show immediate feedback
    // Auto-approved tasks go to 'approved', others to 'completed' (pending_approval display)
    const taskType = task.task_type as '刷牙' | '学习' | '运动' | '家务' | '签到';
    const isAutoApproved = taskType === '签到';
    const optimisticStatus = isAutoApproved ? 'approved' : 'completed';

    state.updateTaskStatus(taskId, optimisticStatus);
    set({ isCompleting: true });

    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proofImage }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '请求失败' }));
        throw new Error(error.error || '请求失败');
      }

      const data = await response.json();

      // Update with actual status from server
      state.updateTaskStatus(taskId, data.task.status);

      // Refresh progress
      // For now, just update the progress locally
      const completedCount = state.tasks.filter(t =>
        t.status === 'approved' || t.status === 'completed'
      ).length;
      const newProgress = {
        completed: completedCount,
        total: state.tasks.length,
        progress: Math.round((completedCount / state.tasks.length) * 100),
      };
      set({ progress: newProgress });

      return {
        success: true,
        message: data.message,
        pointsAwarded: data.pointsAwarded,
      };
    } catch (error) {
      // Rollback on error
      state.rollbackTaskStatus(taskId, previousStatus);
      set({ error: error instanceof Error ? error.message : '任务完成失败' });
      return {
        success: false,
        message: error instanceof Error ? error.message : '任务完成失败',
      };
    } finally {
      set({ isCompleting: false });
    }
  },
}));
