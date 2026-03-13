/**
 * Task Sort Selector Component
 *
 * Story 2.8 Task 4: 实现任务排序逻辑
 *
 * 儿童端任务排序选择器
 * - 下拉选择排序方式
 * - 持久化儿童偏好设置
 */

'use client';

import { useState, useEffect, useRef } from 'react';

export type TaskSortOption = 'time' | 'created' | 'points';

interface TaskSortSelectorProps {
  value: TaskSortOption;
  onChange: (sort: TaskSortOption) => void;
}

const SORT_OPTIONS = [
  { value: 'time' as TaskSortOption, label: '按时间', icon: '⏰' },
  { value: 'created' as TaskSortOption, label: '按创建', icon: '🆕' },
  { value: 'points' as TaskSortOption, label: '按积分', icon: '⭐' },
];

export function TaskSortSelector({ value, onChange }: TaskSortSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasInitialized = useRef(false);

  // Load saved preference from localStorage (run once on mount)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const saved = localStorage.getItem('child-task-sort-preference') as TaskSortOption;
    if (saved && SORT_OPTIONS.find(opt => opt.value === saved)) {
      onChange(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle sort option change
  const handleSortChange = (sortOption: TaskSortOption) => {
    onChange(sortOption);
    localStorage.setItem('child-task-sort-preference', sortOption);
    setIsOpen(false);
  };

  const currentOption = SORT_OPTIONS.find(opt => opt.value === value) || SORT_OPTIONS[1];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
      >
        <span className="text-lg">{currentOption.icon}</span>
        <span className="text-sm font-medium text-gray-700">{currentOption.label}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 z-20 bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden min-w-[160px]">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`w-full flex items-center gap-2 px-4 py-3 text-left transition-colors ${
                  value === option.value
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-lg">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
