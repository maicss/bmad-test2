/**
 * Approval Store (Zustand)
 *
 * Story 2.7: Parent Batch Approves Tasks
 * Task 2.6: 实现选中状态管理
 *
 * Manages selection state for batch task approval
 * - Track selected task IDs
 * - Toggle individual/all selection
 * - Clear selection
 */

import { create } from 'zustand';

export interface ApprovalState {
  /** Set of selected task IDs */
  selectedTaskIds: Set<string>;

  /** Toggle selection for a single task */
  toggleTaskSelection: (taskId: string) => void;

  /** Toggle all tasks (select all or deselect all) */
  toggleAllTasks: (taskIds: string[]) => void;

  /** Clear all selections */
  clearSelection: () => void;

  /** Select all tasks */
  selectAll: (allTaskIds: string[]) => void;

  /** Check if a task is selected */
  isTaskSelected: (taskId: string) => boolean;

  /** Get count of selected tasks */
  getSelectedCount: () => number;
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  selectedTaskIds: new Set<string>(),

  toggleTaskSelection: (taskId) => set((state) => {
    const newSelection = new Set(state.selectedTaskIds);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    return { selectedTaskIds: newSelection };
  }),

  toggleAllTasks: (taskIds) => set((state) => {
    const currentSelection = new Set(state.selectedTaskIds);
    if (taskIds.every(id => currentSelection.has(id))) {
      // If all selected, deselect all
      return { selectedTaskIds: new Set() };
    } else {
      // Otherwise, select all
      return { selectedTaskIds: new Set(taskIds) };
    }
  }),

  clearSelection: () => set({ selectedTaskIds: new Set() }),

  selectAll: (allTaskIds) => set({ selectedTaskIds: new Set(allTaskIds) }),

  isTaskSelected: (taskId) => {
    return get().selectedTaskIds.has(taskId);
  },

  getSelectedCount: () => {
    return get().selectedTaskIds.size;
  },
}));
