/**
 * Task Card Component
 *
 * Story 2.6: Parent Uses Template to Quickly Create Task
 * Task 6.1-6.2: Display is_manual badge and visual differentiation
 *
 * Displays a single task with:
 * - Task title, type, points
 * - Status indicator
 * - is_manual badge to distinguish manual tasks from planned tasks
 * - Action buttons (edit/delete for manual tasks)
 *
 * Source: Story 2.6 AC #6
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Pencil, Trash2, Calendar, Star } from 'lucide-react';

// Task status configuration
const STATUS_CONFIG = {
  pending: { label: '待完成', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  approved: { label: '已通过', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-800' },
  skipped: { label: '已跳过', color: 'bg-gray-100 text-gray-800' },
} as const;

// Task type emoji mapping
const TASK_TYPE_EMOJI: Record<string, string> = {
  '刷牙': '🦷',
  '学习': '📚',
  '运动': '⚽',
  '家务': '🧹',
  '自定义': '✨',
};

export interface TaskCardProps {
  id: string;
  title: string;
  taskType: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'skipped';
  scheduledDate: string;
  isManual: boolean;
  notes?: string | null;
  // Actions
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  // Permissions
  canEdit?: boolean;
  canDelete?: boolean;
  canChangeStatus?: boolean;
}

/**
 * Task Card Component
 *
 * Displays task information with visual distinction for manual tasks
 */
export function TaskCard({
  id,
  title,
  taskType,
  points,
  status,
  scheduledDate,
  isManual,
  notes,
  onEdit,
  onDelete,
  onStatusChange,
  canEdit = false,
  canDelete = false,
  canChangeStatus = false,
}: TaskCardProps) {
  const statusConfig = STATUS_CONFIG[status];
  const taskEmoji = TASK_TYPE_EMOJI[taskType] || '📋';

  return (
    <Card className={`w-full transition-all hover:shadow-md ${
      isManual ? 'border-blue-300 bg-blue-50/30' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Task Title with Emoji */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{taskEmoji}</span>
            <h3 className="font-semibold text-base truncate">{title}</h3>
          </div>

          {/* Manual Task Badge */}
          {isManual && (
            <Badge variant="secondary" className="flex-shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-200">
              手动
            </Badge>
          )}
        </div>

        {/* Task Type Badge */}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {taskType}
          </Badge>

          {/* Status Badge */}
          <Badge className={`text-xs ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>

          {/* Points Badge */}
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {points}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Scheduled Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{scheduledDate}</span>
        </div>

        {/* Notes (if present) */}
        {notes && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {notes}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex gap-2 w-full">
          {/* Edit Button (only for manual tasks) */}
          {isManual && canEdit && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(id)}
              className="flex-1"
            >
              <Pencil className="h-4 w-4 mr-1" />
              编辑
            </Button>
          )}

          {/* Delete Button (only for manual tasks) */}
          {isManual && canDelete && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(id)}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              删除
            </Button>
          )}

          {/* Status Change Button (for child) */}
          {canChangeStatus && onStatusChange && status === 'pending' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onStatusChange(id, 'completed')}
              className="flex-1"
            >
              标记完成
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default TaskCard;
