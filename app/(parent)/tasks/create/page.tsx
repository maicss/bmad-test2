/**
 * Task Plans Page
 *
 * Story 2.1: Parent Creates Task Plan Template
 *
 * This page allows parents to:
 * - View existing task plans
 * - Create new task plans
 * - Edit draft task plans
 *
 * Source: Story 2.1 AC #1
 */

'use client';

import { useState } from 'react';
import { TaskPlanForm, TaskPlanFormData } from '@/components/forms/task-plan-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Mock child data - this should come from an API call
const MOCK_CHILDREN = [
  { id: 'child-1', name: '小明' },
  { id: 'child-2', name: '小红' },
];

/**
 * Task Plans Creation Page
 *
 * Page where parents can create new task plan templates
 */
export default function CreateTaskPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle form submission
   *
   * Story 2.3 Task 4.4: Serialize dateRule to JSON for API
   * The dateRule contains the complete date generation configuration
   * including frequency type, days of week, interval, specific dates,
   * and excluded dates.
   */
  const handleSubmit = async (formData: TaskPlanFormData, status: 'draft' | 'published') => {
    setIsLoading(true);

    try {
      // Prepare data for API
      // Story 2.3 Task 4.4: Serialize the complete dateRule object to JSON
      // The dateRule field contains the entire date generation configuration
      const requestData = {
        title: formData.title,
        task_type: formData.task_type,
        points: formData.points,
        rule: JSON.stringify(formData.dateRule),
        reminder_time: formData.reminder_time || undefined,
        status,
        assigned_children: formData.assigned_children,
      };

      // Get session token from cookie
      const response = await fetch('/api/task-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show error toast
        toast.error(result.error || '创建任务模板失败，请稍后重试');
        return;
      }

      // Show success toast
      toast.success(result.message || '任务模板创建成功！');

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/tasks');
        router.refresh();
      }, 1500);

    } catch (err) {
      console.error('Create task plan error:', err);
      toast.error('网络错误，请检查您的连接后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Task Plan Form */}
      <TaskPlanForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        children={MOCK_CHILDREN}
        isLoading={isLoading}
      />

      {/* Info Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">关于任务模板</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>草稿</strong>：保存为草稿的模板不会生成任务实例，您可以稍后编辑并发布</p>
          <p>• <strong>立即发布</strong>：发布后，系统会根据循环规则自动生成未来7天的任务实例</p>
          <p>• <strong>循环规则</strong>：系统会根据您选择的规则自动生成重复性任务</p>
          <p>• <strong>积分值</strong>：任务完成后，儿童可获得相应积分（1-100分）</p>
        </CardContent>
      </Card>
    </div>
  );
}
