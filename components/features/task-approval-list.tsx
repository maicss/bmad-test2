/**
 * Task Approval List Component
 *
 * Story 2.7: Parent Batch Approves Tasks
 * Task 1: 实现任务审批页面UI
 * Task 2: 实现批量选择功能
 *
 * Displays list of tasks pending approval (completed by child, waiting parent approval)
 * - Task cards with name, icon, completion time
 * - Child name display
 * - Proof image display (Task 8)
 * - Batch selection checkboxes
 * - Filter by status and child
 *
 * Source: Story 2.7 AC - 进入任务审批页面，显示待审批任务列表
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useApprovalStore } from '@/lib/store/approval-store';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import { BatchApproveDialog } from '@/components/dialogs/batch-approve-dialog';
import { BatchRejectDialog } from '@/components/dialogs/batch-reject-dialog';
import { ProofImagePreview } from '@/components/features/proof-image-preview';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  task_type: string;
  points: number;
  status: string;
  completed_at: Date | null;
  proof_image: string | null;
  assigned_child_id: string | null;
  created_at: Date;
}

interface Child {
  id: string;
  name: string | null;
}

interface TaskApprovalListProps {
  familyId: string;
  tasks: Task[];
  familyChildren: Child[];
  onRefresh?: () => Promise<void>;
}

// Task type icons mapping
export const taskTypeIcons: Record<string, string> = {
  '刷牙': '🦷',
  '学习': '📚',
  '运动': '🏃',
  '家务': '🧹',
  '自定义': '⭐',
};

export function TaskApprovalList({
  familyId, // keeping for props compatibility
  tasks,
  familyChildren,
  onRefresh,
}: TaskApprovalListProps) {
  const [selectedStatus, setSelectedStatus] = useState<'completed' | 'approved' | 'rejected'>('completed');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    selectedTaskIds,
    toggleTaskSelection,
    toggleAllTasks,
    clearSelection,
    isTaskSelected,
    getSelectedCount,
  } = useApprovalStore();

  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const handlePointerDown = useCallback(() => {
    if (selectedStatus !== 'completed') return;
    
    pressTimerRef.current = setTimeout(() => {
      // Long press triggers select all
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      toggleAllTasks(filteredTasks.map(t => t.id));
      pressTimerRef.current = null;
    }, 500);
  }, [filteredTasks, selectedStatus, toggleAllTasks]);

  const clearTimer = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent, taskId: string) => {
    if (!touchStartRef.current || selectedStatus !== 'completed') return;

    const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const diffY = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);

    // If swiped horizontally mostly and passed threshold
    if (Math.abs(diffX) > 50 && diffY < 30) {
      // Swipe left or right both toggle for better UX, or swipe right to select, left to unselect
      toggleTaskSelection(taskId);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(20);
      }
    }
    
    touchStartRef.current = null;
  };

  // Update filtered tasks when props or filters change
  useEffect(() => {
    let result = tasks.filter(t => t.status === selectedStatus);
    if (selectedChildId) {
      result = result.filter(t => t.assigned_child_id === selectedChildId);
    }
    setFilteredTasks(result);
  }, [tasks, selectedChildId, selectedStatus]);

  // Get child name by ID
  const getChildName = (childId: string | null): string => {
    if (!childId) return '未知儿童';
    const child = familyChildren.find(c => c.id === childId);
    return child?.name || '未知儿童';
  };

  // Format timestamp
  const formatTime = (date: Date | null): string => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Handle approve action
  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const selectedTasks = filteredTasks.filter(t => isTaskSelected(t.id));
      const taskIds = selectedTasks.map(t => t.id);

      const response = await fetch('/api/tasks/batch-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '审批失败');
      }

      toast.success(data.message || `已批准 ${data.approvedCount} 个任务，+${data.totalPoints} 积分`);
      clearSelection();
      setApproveDialogOpen(false);
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '审批失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject action
  const handleReject = async (reason: string) => {
    setIsProcessing(true);
    try {
      const selectedTasks = filteredTasks.filter(t => isTaskSelected(t.id));
      const taskIds = selectedTasks.map(t => t.id);

      const response = await fetch('/api/tasks/batch-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '驳回失败');
      }

      toast.success(data.message || `已驳回 ${data.rejectedCount} 个任务`);
      clearSelection();
      setRejectDialogOpen(false);
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '驳回失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle single task approve
  const handleSingleApprove = async (taskId: string) => {
    toggleTaskSelection(taskId);
    setApproveDialogOpen(true);
  };

  // Handle single task reject
  const handleSingleReject = async (taskId: string) => {
    toggleTaskSelection(taskId);
    setRejectDialogOpen(true);
  };

  const selectedCount = getSelectedCount();
  const allSelected = filteredTasks.length > 0 && filteredTasks.every(t => isTaskSelected(t.id));

  return (
    <div className="space-y-4">
      {/* Status Filters */}
      <div className="flex gap-2 mb-2">
        <Button
          variant={selectedStatus === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('completed')}
          data-testid="status-filter-pending"
        >
          待审批
        </Button>
        <Button
          variant={selectedStatus === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('approved')}
          data-testid="status-filter-approved"
        >
          已批准
        </Button>
        <Button
          variant={selectedStatus === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('rejected')}
          data-testid="status-filter-rejected"
        >
          已驳回
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={selectedChildId === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChildId(null)}
            data-testid="child-filter-button"
          >
            全部儿童
          </Button>
          {familyChildren.map(child => (
            <Button
              key={child.id}
              variant={selectedChildId === child.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChildId(child.id)}
              data-testid="child-filter-button"
            >
              {child.name}
            </Button>
          ))}
        </div>

        {selectedStatus === 'completed' && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => toggleAllTasks(filteredTasks.map(t => t.id))}
              data-testid="select-all-checkbox"
            />
            <span className="text-sm text-muted-foreground">全选</span>
          </div>
        )}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card className="p-8 text-center" data-testid="task-approval-list">
          <p className="text-muted-foreground">暂无待审批任务</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <Card 
              key={task.id} 
              className="p-4" 
              data-testid="task-card"
              onPointerDown={handlePointerDown}
              onPointerUp={clearTimer}
              onPointerMove={clearTimer}
              onPointerLeave={clearTimer}
              onContextMenu={(e) => { 
                // Only prevent context menu if we are in state to show long press action
                if (selectedStatus === 'completed') {
                  e.preventDefault(); 
                }
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleTouchEnd(e, task.id)}
            >
              <div className="flex items-start gap-3 pointer-events-none sm:pointer-events-auto">
                {/* Checkbox (only for completed/pending approval status) */}
                {selectedStatus === 'completed' && (
                  <div className="pointer-events-auto">
                    <Checkbox
                      checked={isTaskSelected(task.id)}
                      onCheckedChange={() => toggleTaskSelection(task.id)}
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Task Icon */}
                <div className="text-2xl" data-testid="task-icon">
                  {taskTypeIcons[task.task_type] || taskTypeIcons['自定义']}
                </div>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-medium" data-testid="task-title">{task.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span data-testid="child-name">{getChildName(task.assigned_child_id)}</span>
                        <span>•</span>
                        <span data-testid="completion-time">{formatTime(task.completed_at)}</span>
                        <Badge variant="secondary" className="ml-1" data-testid="points-badge">
                          +{task.points} 积分
                        </Badge>
                      </div>
                    </div>

                    {/* Action Buttons (only for completed/pending approval status) */}
                    {selectedStatus === 'completed' ? (
                      <div className="flex gap-2 pointer-events-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSingleApprove(task.id)}
                          disabled={isProcessing}
                          aria-label="通过任务"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSingleReject(task.id)}
                          disabled={isProcessing}
                          aria-label="驳回任务"
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant={selectedStatus === 'approved' ? 'default' : 'destructive'} className="self-start">
                        {selectedStatus === 'approved' ? '已批准' : '已驳回'}
                      </Badge>
                    )}
                  </div>

                  {/* Proof Image */}
                  {task.proof_image && (
                    <div className="mt-2">
                      <ProofImagePreview
                        imageUrl={task.proof_image}
                        taskTitle={task.title}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Batch Action Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50" data-testid="batch-action-bar">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <span className="text-sm font-medium">
              已选择 {selectedCount} 个任务
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearSelection}
                disabled={isProcessing}
              >
                取消选择
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
                disabled={isProcessing}
                data-testid="batch-reject-button"
              >
                驳回
              </Button>
              <Button
                onClick={() => setApproveDialogOpen(true)}
                disabled={isProcessing}
                data-testid="batch-approve-button"
              >
                通过
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Approve Dialog */}
      <BatchApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        taskIds={Array.from(selectedTaskIds)}
        tasks={filteredTasks.filter(t => isTaskSelected(t.id))}
        onConfirm={handleApprove}
      />

      {/* Batch Reject Dialog */}
      <BatchRejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        taskIds={Array.from(selectedTaskIds)}
        tasks={filteredTasks.filter(t => isTaskSelected(t.id))}
        onConfirm={handleReject}
      />
    </div>
  );
}
