/**
 * Task Plans List Page
 *
 * Story 2.1: Parent Creates Task Plan Template
 *
 * This page displays all task plans for the parent's family
 *
 * Source: Story 2.1
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TaskPlan {
  id: string;
  title: string;
  task_type: string;
  points: number;
  status: 'draft' | 'published';
  created_at: string;
  rule: string;
}

/**
 * Task Plans List Page
 *
 * Displays all task plans with actions to create, edit, delete
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

  const getFrequencyLabel = (ruleJson: string): string => {
    try {
      const rule = JSON.parse(ruleJson);
      const frequencyMap: Record<string, string> = {
        daily: '每天',
        weekly: '每周',
        weekdays: '工作日',
        weekends: '周末',
        custom: '自定义',
      };
      return frequencyMap[rule.frequency] || rule.frequency;
    } catch {
      return '未知';
    }
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
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              还没有创建任何任务模板
            </p>
            <Link href="/tasks/create">
              <Button>创建第一个模板</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Task Plans List */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {taskPlans.map(plan => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <Badge variant={plan.status === 'published' ? 'default' : 'secondary'}>
                    {plan.status === 'published' ? '已发布' : '草稿'}
                  </Badge>
                </div>
                <CardDescription>
                  {plan.task_type} · {plan.points} 积分
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    循环规则：{getFrequencyLabel(plan.rule)}
                  </p>
                  <p className="text-muted-foreground">
                    创建时间：{new Date(plan.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    编辑
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
