/**
 * Task Plans List Page
 *
 * Story 2.1: Parent Creates Task Plan Template
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 *
 * This page displays all task plans for the parent's family
 * with pause/resume/delete actions
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TaskPlanList } from '@/components/features/task-plan-list';
import { toast } from 'sonner';
import type { TaskPlanStatus } from '@/lib/db/queries/task-plans';

interface TaskPlan {
  id: string;
  title: string;
  task_type: string;
  points: number;
  status: TaskPlanStatus;
  paused_until?: Date | string | null;
  created_at: string;
  rule: string;
}

/**
 * Task Plans List Page
 *
 * Displays all task plans with pause/resume/delete actions
 */
export default function TaskPlansPage() {
  const [taskPlans, setTaskPlans] = useState<TaskPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch task plans on mount
  useEffect(() => {
    fetchTaskPlans();
  }, []);

  const fetchTaskPlans = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/task-plans', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('请先登录');
        } else if (response.status === 403) {
          setError('只有家长可以查看任务模板');
        } else {
          setError('获取任务模板失败，请稍后重试');
        }
        return;
      }

      const result = await response.json();
      setTaskPlans(result.plans || []);

    } catch (err) {
      console.error('Fetch task plans error:', err);
      setError('网络错误，请检查您的连接后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async (planId: string, durationDays: number | null) => {
    try {
      const response = await fetch(`/api/task-plans/${planId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ durationDays }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '暂停失败');
      }

      await fetchTaskPlans();
    } catch (err) {
      throw err;
    }
  };

  const handleResume = async (planId: string) => {
    try {
      const response = await fetch(`/api/task-plans/${planId}/resume`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '恢复失败');
      }

      await fetchTaskPlans();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (planId: string) => {
    try {
      const response = await fetch(`/api/task-plans?id=${planId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除失败');
      }

      await fetchTaskPlans();
    } catch (err) {
      throw err;
    }
  };

  const handleEdit = (planId: string) => {
    window.location.href = `/tasks/edit/${planId}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Task Plans List Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">任务模板</h1>
          <p className="text-muted-foreground">管理您的任务计划模板</p>
        </div>
        <Link href="/tasks/create">
          <Button>创建模板</Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : taskPlans.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">
            还没有创建任何任务模板
          </p>
          <Link href="/tasks/create">
            <Button>创建第一个模板</Button>
          </Link>
        </div>
      ) : (
        /* Task Plans List with Actions */
        <div className="max-w-4xl mx-auto">
          <TaskPlanList
            taskPlans={taskPlans}
            onPause={handlePause}
            onResume={handleResume}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </div>
      )}
    </div>
  );
}
