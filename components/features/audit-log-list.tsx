/**
 * Audit Log List Component
 *
 * Story 2.10 Task 5: Add approval history and audit log UI
 *
 * Displays audit log history for approval/rejection actions
 * - Shows action type, timestamp, and details
 * - Expandable metadata for additional context
 *
 * Source: Story 2.10 AC3 - 审批操作记录到审计日志
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AuditLog {
  id: string;
  action_type: string;
  metadata: string | null;
  created_at: string;
}

interface AuditLogListProps {
  userId: string;
  limit?: number;
}

// Action type display names
const actionTypeNames: Record<string, string> = {
  'approve_task': '通过任务',
  'reject_task': '驳回任务',
  'batch_approve_tasks': '批量通过',
  'batch_reject_tasks': '批量驳回',
  'task_complete': '完成任务',
  'login': '登录',
  'register': '注册',
};

// Action type badge colors
const actionTypeColors: Record<string, 'default' | 'destructive' | 'secondary'> = {
  'approve_task': 'default',
  'reject_task': 'destructive',
  'batch_approve_tasks': 'default',
  'batch_reject_tasks': 'destructive',
  'task_complete': 'secondary',
  'login': 'secondary',
  'register': 'secondary',
};

export function AuditLogList({ userId, limit = 20 }: AuditLogListProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/audit-logs?limit=${limit}`, {
          headers: {
            'Cookie': document.cookie,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }

        const data = await response.json();
        setAuditLogs(data.auditLogs || []);
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuditLogs();
  }, [userId, limit]);

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get metadata display
  const getMetadataDisplay = (metadata: string | null): string | null => {
    if (!metadata) return null;

    try {
      const parsed = JSON.parse(metadata);

      // Format specific metadata types
      if (parsed.taskTitle) {
        const points = parsed.points ? ` (+${parsed.points} 积分)` : '';
        return `任务: ${parsed.taskTitle}${points}`;
      }
      if (parsed.reason) {
        return `原因: ${parsed.reason}`;
      }
      if (parsed.approvedCount) {
        return `数量: ${parsed.approvedCount} 个任务`;
      }
      if (parsed.rejectedCount) {
        return `数量: ${parsed.rejectedCount} 个任务`;
      }

      return null;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">审批历史</h3>
        <p className="text-sm text-muted-foreground">加载中...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">审批历史</h3>
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  // Filter only approval-related logs
  const approvalLogs = auditLogs.filter(log =>
    log.action_type.includes('approve') ||
    log.action_type.includes('reject')
  );

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">审批历史</h3>

      {approvalLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无审批记录</p>
      ) : (
        <div className="space-y-3">
          {approvalLogs.map(log => {
            const metadataDisplay = getMetadataDisplay(log.metadata);
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={actionTypeColors[log.action_type] || 'secondary'}>
                        {actionTypeNames[log.action_type] || log.action_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(log.created_at)}
                      </span>
                    </div>

                    {metadataDisplay && (
                      <p className="text-sm text-foreground/80 mt-1">
                        {metadataDisplay}
                      </p>
                    )}
                  </div>

                  {log.metadata && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>

                {isExpanded && log.metadata && (
                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
