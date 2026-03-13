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
import { handleError, handleSuccess, retryWithBackoff, networkStatus } from '@/lib/utils/error-handler';

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

  // Complete task with optimistic update and error handling
  completeTask: async (taskId: string, proofImage?: string) => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);

    if (!task) {
      handleError('任务不存在');
      return { success: false, message: '任务不存在' };
    }

    if (task.status !== 'pending') {
      handleError('任务已完成或正在处理中');
      return { success: false, message: '任务已完成或正在处理中' };
    }

    const previousStatus = task.status;

    // Optimistic update: show immediate feedback
    // Story 2.9: checkin (签到) is auto-approved → completed, others → pending_approval
    const taskType = task.task_type as '刷牙' | '学习' | '运动' | '家务' | '签到';
    const isAutoApproved = taskType === '签到';
    const optimisticStatus = isAutoApproved ? 'completed' : 'pending_approval';

    state.updateTaskStatus(taskId, optimisticStatus);
    set({ isCompleting: true });

    try {
      // Check network status first
      if (!networkStatus.isOnline()) {
        throw new Error('网络连接失败，请检查网络后重试');
      }

      // Use retry with backoff for network resilience
      const response = await retryWithBackoff(
        async () => {
          const res = await fetch(`/api/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ proofImage }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: '请求失败' }));
            throw new Error(errorData.error || '请求失败');
          }

          return res;
        },
        3, // max retries
        1000 // initial delay
      );

      const data = await response.json();

      // Update with actual status from server
      state.updateTaskStatus(taskId, data.task.status);

      // Refresh progress
      // Story 2.9: completed status means task is done (parent approved or auto-approved)
      const completedCount = state.tasks.filter(t =>
        t.status === 'completed'
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

      const errorMessage = error instanceof Error ? error.message : '任务完成失败';
      set({ error: errorMessage });

      // Show user-friendly error toast
      handleError(error, undefined, errorMessage);

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      set({ isCompleting: false });
    }
  },
}));
